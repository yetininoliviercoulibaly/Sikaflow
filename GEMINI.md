# SikaFlow Agents Context

## Repository Overview

SikaFlow is an event management platform designed to help event organizers manage ticketing, teams, and finances.

### Tech Stack

- **Backend (Host-Backend)**: NestJS, Hexagonal Architecture, MikroORM.
- **Frontend (Host-Frontend)**: React, Vite, TailwindCSS (check specific files).

## ⚠️ Critical Architecture Rules

**You must read and strictly follow the architecture rules defined in the documentation files.**
Do not rely on general knowledge; strictly adhere to the project-specific rules found in:

- **Backend Rules**: [.agent/rules/backend-dev.md](.agent/rules/backend-dev.md)
  - Key points: Strict Hexagonal Architecture, Domain Purity (No ORM decorators in domain), Interface-based Dependency Injection.

- **Frontend Rules**: [.agent/rules/frontend-dev.md](.agent/rules/frontend-dev.md)
  - Key points: Feature-Sliced Design inspiration, Smart vs Dumb components breakdown.

## Guidelines for Agents

1. **Read the Docs First**: Before proposing or making changes, read the relevant architecture documentation linked above.
2. **Clean Code**: Follow SOLID principles.
3. **Testing**: Ensure all business logic is covered by unit tests.
