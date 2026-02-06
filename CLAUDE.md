# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SikaFlow is an AI-Powered SaaS platform ("WhatsApp-First") for event management. Users interact via WhatsApp/Telegram to manage transactions, ticketing, team members, and reports. The AI (Google Gemini) extracts structured data from unstructured messages (text, voice, images).

**Monorepo with three apps:**
- `backend/` — NestJS 11, MikroORM 6, PostgreSQL, Redis/BullMQ, Google Gemini AI
- `frontend/` — Next.js 16 (React 19), Tailwind CSS (dashboard)
- `scanner/` — Vite 7 + React 19 (QR code scanning PWA)

## Build & Development Commands

### Backend (run from `backend/`)
```bash
npm run build          # Compile TypeScript (nest build)
npm run start:dev      # Watch mode
npm run test           # Run all Jest tests
npx jest path/to/file.spec.ts  # Run a single test file
npm run migration:create       # Create new MikroORM migration
npm run migration:up           # Apply migrations
npm run migration:down         # Rollback migration
npm run seed:run               # Run database seeders
```

### Frontend (run from `frontend/`)
```bash
npm run dev            # Dev server (port 3001)
npm run build          # Production build
npm run lint           # ESLint
```

### Scanner (run from `scanner/`)
```bash
npm run dev            # Vite dev server (port 5173)
npm run build          # tsc + vite build
npm run lint           # ESLint
```

### Docker (full stack from root)
```bash
docker compose -f docker-compose.local.yml up --build
```
Services: PostgreSQL (:5434), Redis (:6380), Backend (:3000), Frontend (:3001), Scanner (:3002)

## Architecture: Strict Hexagonal (Ports & Adapters)

Every backend module follows this mandatory structure:

```
src/{module}/
├── domain/                    # Pure business logic — NO framework deps
│   ├── {entity}.entity.ts     # Plain TypeScript class (POJO, no decorators)
│   └── ports/                 # Repository/service interfaces + DI tokens
├── application/
│   ├── use-cases/             # Business orchestration (one class per use case)
│   ├── dtos/                  # Input/output validation objects
│   ├── handlers/              # Action handlers (webhook module)
│   └── controllers/           # NestJS REST controllers
└── infrastructure/
    ├── persistence/           # MikroORM EntitySchema + repository implementations
    └── adapters/              # External service adapters (Stripe, WhatsApp, etc.)
```

### Critical Rules
- **Domain entities must be POJOs** — no `@Entity()`, `@Property()`, or any ORM annotations. MikroORM mapping is done via `EntitySchema` in `infrastructure/persistence/`.
- **Always use interface-based DI** — inject via tokens (e.g., `@Inject(I_ORGANIZATION_REPOSITORY)`), never concrete classes.
- **Token naming convention**: `I_{NAME}_REPOSITORY`, `I_{NAME}_SERVICE`, `LLM_PROVIDER_TOKEN`, `ACTION_HANDLER_TOKEN`, etc.

## Webhook Message Processing Flow

This is the central orchestration path — most features are triggered through it:

1. **Controller** (WhatsApp/Telegram) receives webhook, verifies signature, queues message to BullMQ
2. **Processor** dequeues from Redis, parses platform-specific format into unified format
3. **ProcessUnifiedMessageUseCase** resolves user/org context, sends message to LLM for intent extraction
4. **IntentResolverService** maps LLM output to an action
5. **ActionExecutionService** dispatches to the appropriate **IActionHandler** (25+ handlers)
6. Handler calls the relevant use case, then responds via `IMessagingService`

## Key Abstractions

### Multi-Platform Messaging
`IMessagingService` (in `common/messaging/`) provides a platform-agnostic interface. Adapters exist for WhatsApp Cloud API and Telegram Bot API. Parser services convert platform-specific payloads to a unified format.

### LLM Provider
`ILLMProvider` (token: `LLM_PROVIDER_TOKEN`) abstracts AI capabilities. Production uses `GeminiLLMProvider`; tests use `FakeLLMProvider`. Supports text analysis, media analysis (OCR), and audio transcription.

### Payment Provider
Factory pattern switches between `StripePaymentProvider` and `WavePaymentProvider` based on region config (`PAYMENT_REGION` env var).

### Agent Module
LangChain/LangGraph-based agentic workflows in `src/agent/`. The `LangChainAgentAdapter` orchestrates multi-step AI tool calls (20+ tools) for complex user requests.

## Database

- **ORM**: MikroORM 6 with PostgreSQL driver
- **Config**: `backend/src/mikro-orm.config.ts` — 19 entity schemas registered
- **Migrations**: `backend/src/database/migrations/`
- **Seeders**: `backend/src/database/seeders/`
- **MikroORM CLI** reads config from `backend/dist/src/mikro-orm.config.js` (build first)

## Testing Conventions

- Test files: `*.spec.ts` co-located with source
- Framework: Jest with ts-jest
- UUID is mocked globally via `src/__mocks__/uuid.ts`
- Mock repositories at the port interface level, not at ORM level
- Use `Test.createTestingModule()` for DI setup in tests
- `@langchain` and `@google/generative-ai` are transformed (not ignored) in Jest config

## Module Dependency Map

`webhook` is the hub — it depends on nearly all other modules. Key relationships:
- `webhook` → `organization`, `user`, `transaction`, `ticketing`, `subscription`, `payment`, `report`, `onboarding`, `feedback`, `incident`, `contact`, `agent`
- `auth` → `user`, `organization`, `common/whatsapp`, `common/telegram`
- `payment` → `subscription`, `ticketing`, `organization`
- `report` → `transaction`, `ticketing`, `organization` (async via BullMQ `reports` queue)

## Frontend Architecture

Feature-based organization with Smart/Dumb component pattern:
```
frontend/src/features/{feature}/
├── components/   # Smart components (state + logic)
├── hooks/        # Custom hooks
├── services/     # API calls (Axios)
└── types/        # Local TypeScript types
```
Uses Next.js App Router with route groups: `(auth)/` and `(dashboard)/`.

## CI/CD

- **Gemini CI** (`.github/workflows/gemini-ci.yml`): Automated AI code review + QA plan generation on PRs using Gemini CLI
- PR target branch: `main`

## Environment

Key env vars (see `backend/env.example` for full list):
- `BYPASS_SUBSCRIPTION_CHECK=true` — useful for local dev to skip subscription validation
- `GOOGLE_API_KEY` — required for Gemini LLM features
- `PAYMENT_REGION` — determines Stripe vs Wave payment provider
- MikroORM CLI requires building first (`npm run build`) since `configPaths` points to `dist/`
