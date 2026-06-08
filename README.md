# 🚀 SikaFlow

**The AI-Powered Orchestration OS for Modern Event Management.**

SikaFlow est une plateforme SaaS **« WhatsApp-First »** qui digitalise la gestion opérationnelle et financière des événements. Les utilisateurs interagissent via **WhatsApp / Telegram** ; une **IA multimodale (Google Gemini)** transforme messages, notes vocales, images et PDF en données structurées (transactions, billets, incidents, rapports).

<p align="left">
  <img alt="NestJS" src="https://img.shields.io/badge/Backend-NestJS_11-E0234E?logo=nestjs&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Frontend-Next.js_16-000000?logo=nextdotjs&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Scanner-Vite_7_+_React_19-646CFF?logo=vite&logoColor=white">
  <img alt="ZeroClaw" src="https://img.shields.io/badge/Agent-ZeroClaw_(Rust)-DEA584?logo=rust&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql&logoColor=white">
  <img alt="Gemini" src="https://img.shields.io/badge/AI-Google_Gemini-8E75B2?logo=googlegemini&logoColor=white">
</p>

---

## 📑 Sommaire

- [Présentation](#-présentation)
- [Fonctionnalités clés](#-fonctionnalités-clés)
- [Architecture du monorepo](#-architecture-du-monorepo)
- [Stack technique](#-stack-technique)
- [Architecture logicielle](#-architecture-logicielle)
- [Prérequis](#-prérequis)
- [Démarrage rapide (Docker)](#-démarrage-rapide-docker)
- [Installation manuelle](#-installation-manuelle)
- [Variables d'environnement](#-variables-denvironnement)
- [Base de données](#-base-de-données)
- [Tests & qualité](#-tests--qualité)
- [Déploiement](#-déploiement)
- [Documentation](#-documentation)
- [Conventions de contribution](#-conventions-de-contribution)

---

## 🌍 Présentation

SikaFlow cible deux marchés via une seule plateforme :

- **Afrique francophone** — promoteurs de concerts et de matchs : gestion du cash, Mobile Money (**Wave**), rapports sponsors. L'IA comprend le **Nouchi**.
- **Québec (Montréal)** — *nightlife* : calcul des taxes **TPS/TVQ**, pourboires, conformité RACJ/sécurité. L'IA comprend le **Joual**.

L'interface principale est la messagerie : **aucune application à installer** pour les opérateurs terrain. Un **dashboard web** et une **PWA de scan QR** complètent l'expérience pour les administrateurs et le contrôle d'accès.

---

## ✨ Fonctionnalités clés

| Domaine | Description |
| :------ | :---------- |
| 📱 **Multi-plateforme** | Orchestration WhatsApp **et** Telegram via une interface unifiée `IMessagingService` |
| 🧠 **IA multimodale** | Analyse de texte, transcription audio, OCR d'images et de PDF via Gemini |
| 🤖 **Agents conversationnels** | Workflows agentiques multi-étapes (backend LangChain/LangGraph + moteur **ZeroClaw** en Rust) |
| 💸 **Transactions** | Enregistrement de revenus/dépenses extraits de messages non structurés |
| 🎫 **Billetterie & événements** | Création d'événements, génération de billets/QR, validation au scan |
| 🏢 **Organisations** | Multi-utilisateurs avec rôles hiérarchiques (Admin, Manager, Staff) |
| 💳 **Paiements** | Abonnements & *event pass* — **Stripe** (international) ou **Wave** (Afrique) |
| 📊 **Reporting** | Rapports PDF « sponsor-ready » / « comptable-ready » générés en asynchrone |
| 🛡️ **Registre d'incidents** | Consignation instantanée pour traçabilité légale |
| 👋 **Onboarding guidé** | Parcours interactif automatisé pour les nouveaux utilisateurs |

---

## 🧩 Architecture du monorepo

```
SikaFlow/
├── backend/          # API NestJS 11 — webhooks, IA, métier, persistance (PostgreSQL)
├── frontend/         # Dashboard Next.js 16 (React 19, Tailwind)
├── scanner/          # PWA de scan QR — Vite 7 + React 19
├── zeroclaw/         # Config de l'agent ZeroClaw (system prompt, schéma mémoire, onboarding)
├── zeroclaw-engine/  # Moteur d'agent ZeroClaw (Rust) — service conteneurisé
├── cloudflare/       # Configuration du tunnel Cloudflare
├── scripts/          # Scripts utilitaires (validation des workflows CI)
├── docs/             # Guides de déploiement & documents stratégiques
└── docker-compose.*.yml  # Stacks local / staging / prod
```

| App | Stack | Port (local) | Rôle |
| :-- | :---- | :----------- | :--- |
| **backend** | NestJS 11, MikroORM 6, BullMQ | `3000` | API REST + webhooks + traitement IA |
| **frontend** | Next.js 16, React 19, Tailwind | `3001` | Tableau de bord organisateur |
| **scanner** | Vite 7, React 19, html5-qrcode | `5173` (dev) / `3002` (docker) | Validation des billets par QR |
| **zeroclaw-engine** | Rust | — | Moteur d'agent conversationnel (staging/prod) |

---

## 🛠️ Stack technique

| Composant | Technologie |
| :-------- | :---------- |
| **Framework API** | [NestJS 11](https://nestjs.com/) |
| **ORM** | [MikroORM 6](https://mikro-orm.io/) (Data Mapper, entités POJO) |
| **Base de données** | PostgreSQL |
| **Cache & files** | Redis + [BullMQ](https://docs.bullmq.io/) (traitement asynchrone) |
| **IA** | [Google Gemini](https://deepmind.google/technologies/gemini/) (`@google/generative-ai`) |
| **Agent (backend)** | [LangChain](https://www.langchain.com/) / [LangGraph](https://langchain-ai.github.io/langgraph/) |
| **Agent (ZeroClaw)** | Moteur conversationnel en **Rust** (service dédié, WhatsApp/Telegram) |
| **Messagerie** | WhatsApp Cloud API (Meta) + Telegram Bot API |
| **Paiements** | Stripe / Wave (factory selon `PAYMENT_REGION`) |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Framer Motion, Recharts |
| **Scanner** | Vite 7, React 19, html5-qrcode |
| **Conteneurisation** | Docker & Docker Compose |
| **CI/CD** | GitHub Actions + revue IA via Gemini CLI |

---

## 🏗️ Architecture logicielle

### Hexagonale stricte (Ports & Adapters)

Chaque module backend respecte cette structure :

```
src/{module}/
├── domain/                 # Logique métier pure — AUCUNE dépendance framework
│   ├── {entity}.entity.ts  # POJO (pas de décorateur ORM)
│   └── ports/              # Interfaces (repositories / services) + tokens DI
├── application/
│   ├── use-cases/          # Orchestration métier (une classe par cas d'usage)
│   ├── dtos/               # Objets de validation entrée/sortie
│   ├── handlers/           # Action handlers (module webhook)
│   └── controllers/        # Contrôleurs REST NestJS
└── infrastructure/
    ├── persistence/        # EntitySchema MikroORM + implémentations de repositories
    └── adapters/           # Adaptateurs externes (Stripe, WhatsApp, Gemini…)
```

**Règles non négociables :**
- Les **entités du domaine sont des POJO** — le mapping MikroORM se fait via `EntitySchema` dans `infrastructure/persistence/`.
- **DI par interface uniquement** — injection par token (ex. `@Inject(I_ORGANIZATION_REPOSITORY)`), jamais de classe concrète.
- Convention de nommage des tokens : `I_{NAME}_REPOSITORY`, `I_{NAME}_SERVICE`, `LLM_PROVIDER_TOKEN`, `ACTION_HANDLER_TOKEN`…

### Flux de traitement d'un message (chemin central)

```
WhatsApp/Telegram ─▶ Controller (vérif. signature) ─▶ file BullMQ
        ─▶ Processor (parse format unifié)
        ─▶ ProcessUnifiedMessageUseCase (contexte user/org + appel LLM)
        ─▶ IntentResolverService (intention ─▶ action)
        ─▶ ActionExecutionService ─▶ IActionHandler (28 handlers)
        ─▶ Use case métier ─▶ réponse via IMessagingService
```

### Abstractions principales

- **`IMessagingService`** — interface agnostique de plateforme (adaptateurs WhatsApp / Telegram).
- **`ILLMProvider`** (`LLM_PROVIDER_TOKEN`) — `GeminiLLMProvider` en production, `FakeLLMProvider` en test.
- **Payment factory** — bascule `StripePaymentProvider` / `WavePaymentProvider` selon `PAYMENT_REGION`.
- **Module `agent/` (backend)** — `LangChainAgentAdapter` orchestre les appels d'outils multi-étapes (23 outils).
- **ZeroClaw** — moteur d'agent autonome en **Rust** ([`zeroclaw-engine/`](zeroclaw-engine/)), configuré via [`zeroclaw/`](zeroclaw/) (system prompt, schéma mémoire, parcours d'onboarding) et déployé comme conteneur séparé en staging/production.

---

## 📋 Prérequis

- **Node.js 20+** et **npm**
- **PostgreSQL** et **Redis** (ou Docker, voir plus bas)
- Une **clé API Google Gemini** (`GOOGLE_API_KEY`)
- Pour la messagerie : un **token WhatsApp Cloud API** et/ou un **token Telegram Bot**
- (Optionnel) **Docker** & **Docker Compose** pour lancer toute la stack
- (Optionnel) **Rust / Cargo** pour travailler sur `zeroclaw-engine/`

---

## ⚡ Démarrage rapide (Docker)

La méthode la plus simple — lance la stack web (PostgreSQL, Redis, backend, frontend, scanner) :

```bash
docker compose -f docker-compose.local.yml up --build
```

| Service | URL |
| :------ | :-- |
| Backend (API) | http://localhost:3000 |
| Swagger (hors prod) | http://localhost:3000/api |
| Frontend (dashboard) | http://localhost:3001 |
| Scanner (PWA) | http://localhost:3002 |
| PostgreSQL | `localhost:5434` |
| Redis | `localhost:6380` |

> La stack locale utilise des identifiants factices et `BYPASS_SUBSCRIPTION_CHECK=true`. Pour activer l'IA, exportez `GOOGLE_API_KEY` avant de lancer la commande. Le moteur ZeroClaw n'est inclus que dans les stacks `staging`/`prod`.

---

## 🔧 Installation manuelle

### Backend (`backend/`)

```bash
cd backend
npm install
cp env.example .env        # puis renseignez vos valeurs
npm run build              # requis : le CLI MikroORM lit dist/
npm run migration:up       # applique les migrations
npm run seed:run           # (optionnel) données de démo
npm run start:dev          # mode watch sur le port 3000
```

### Frontend (`frontend/`)

```bash
cd frontend
npm install
npm run dev                # http://localhost:3001
```

### Scanner (`scanner/`)

```bash
cd scanner
npm install
npm run dev                # http://localhost:5173
```

---

## 🔐 Variables d'environnement

> ⚠️ **Aucun secret n'est versionné dans ce dépôt.** Seuls des modèles (`*.example`, `*.template`) contenant des valeurs *placeholder* le sont. Créez vos propres fichiers `.env` localement — ils sont ignorés par Git.

Modèles disponibles :

| Fichier | Usage |
| :------ | :---- |
| [`backend/env.example`](backend/env.example) | Développement local du backend |
| [`backend/env.staging.template`](backend/env.staging.template) | Déploiement staging |
| [`.env.vps.template`](.env.vps.template) | Déploiement VPS (staging/prod) |
| [`zeroclaw-engine/.env.example`](zeroclaw-engine/.env.example) | Moteur d'agent ZeroClaw |

Variables notables (liste complète dans les modèles ci-dessus) :

| Variable | Description |
| :------- | :---------- |
| `GOOGLE_API_KEY` | Clé Gemini — **requise** pour les fonctionnalités IA |
| `PAYMENT_REGION` | `INTERNATIONAL` (Stripe) ou `AFRICA` (Wave) |
| `DB_*`, `REDIS_*` | Connexions PostgreSQL et Redis |
| `WHATSAPP_*`, `TELEGRAM_*` | Identifiants des plateformes de messagerie |
| `JWT_SECRET`, `ADMIN_API_KEY` | Authentification du dashboard / accès admin |
| `BYPASS_SUBSCRIPTION_CHECK` | `true` pour ignorer la validation d'abonnement en local |

📖 Détail de chaque variable : [`docs/ENV-SETUP-GUIDE.md`](docs/ENV-SETUP-GUIDE.md).

---

## 🗄️ Base de données

ORM **MikroORM 6** (PostgreSQL). Le CLI lit la configuration compilée (`dist/`), d'où le `npm run build` préalable.

```bash
cd backend
npm run migration:create   # crée une migration
npm run migration:up       # applique les migrations
npm run migration:down     # rollback
npm run seed:run           # exécute les seeders
```

- Configuration : `backend/src/mikro-orm.config.ts`
- Migrations : `backend/src/database/migrations/`
- Seeders : `backend/src/database/seeders/`

---

## 🧪 Tests & qualité

```bash
# Backend (Jest)
cd backend
npm run test                       # toute la suite
npx jest path/to/file.spec.ts      # un seul fichier

# Lint
cd frontend && npm run lint
cd scanner  && npm run lint
```

- Tests `*.spec.ts` co-localisés avec le code source.
- Repositories mockés **au niveau du port** (interface), pas de l'ORM.
- `FakeLLMProvider` pour tester sans appeler Gemini.

---

## 🚢 Déploiement

Les stacks Docker Compose sont fournies pour chaque environnement :

```bash
docker compose -f docker-compose.staging.yml up -d   # staging
docker compose -f docker-compose.prod.yml up -d      # production
```

Guides détaillés dans [`docs/`](docs/) :

- [`README-DEPLOY.md`](docs/README-DEPLOY.md) — vue d'ensemble du déploiement
- [`DEPLOYMENT-CHECKLIST.md`](docs/DEPLOYMENT-CHECKLIST.md) — checklist de mise en production
- [`ENV-SETUP-GUIDE.md`](docs/ENV-SETUP-GUIDE.md) — configuration des variables d'environnement
- [`CLOUDFLARE-TUNNEL-GUIDE.md`](docs/CLOUDFLARE-TUNNEL-GUIDE.md) — exposition via Cloudflare Tunnel
- [`ZEROCLAW-DEPLOYMENT-GUIDE.md`](docs/ZEROCLAW-DEPLOYMENT-GUIDE.md) — déploiement de l'agent ZeroClaw

---

## 📚 Documentation

| Ressource | Emplacement |
| :-------- | :---------- |
| Architecture technique détaillée | [`backend/docs/architecture.md`](backend/docs/architecture.md) |
| Spécifications fonctionnelles | [`backend/docs/functional_specs.md`](backend/docs/functional_specs.md) |
| Guide d'onboarding utilisateur | [`backend/docs/user_onboarding_guide.md`](backend/docs/user_onboarding_guide.md) |
| Guide CI/CD | [`backend/docs/CICD_SETUP_GUIDE.md`](backend/docs/CICD_SETUP_GUIDE.md) |
| README backend | [`backend/README.md`](backend/README.md) |
| README frontend | [`frontend/README.md`](frontend/README.md) |
| Moteur ZeroClaw (Rust) | [`zeroclaw-engine/README.md`](zeroclaw-engine/README.md) |
| Consignes pour les agents IA | [`CLAUDE.md`](CLAUDE.md) · [`GEMINI.md`](GEMINI.md) |

---

## 🤝 Conventions de contribution

| Couche | Règle |
| :----- | :---- |
| **Domain** | POJO purs, aucune dépendance framework |
| **Application** | Use cases, DTOs, ports d'entrée |
| **Infrastructure** | Adaptateurs, contrôleurs, schémas ORM |

- Branche cible des PR : **`main`**.
- Une revue IA automatique (Gemini CI) s'exécute sur chaque PR.
- Respectez l'architecture hexagonale et la DI par token (voir [`CLAUDE.md`](CLAUDE.md)).

---

<p align="center"><em>SikaFlow — transformer le chaos des conversations en données exploitables.</em></p>
