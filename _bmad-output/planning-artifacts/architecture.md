---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - backend/docs/functional_specs.md
  - backend/docs/features.md
  - backend/docs/architecture.md
  - backend/docs/commercial_strategy.md
  - backend/docs/backend-architecture-rules.md
  - frontend/docs/frontend-architecture-rules.md
  - frontend/docs/frontend-coding-standards.md
  - docs/strategy/SikaFlow_Strategic_Analysis.md
workflowType: "architecture"
project_name: "SikaFlow"
user_name: "Developer"
date: "2026-02-23T22:29:00+01:00"
---

# Architecture Decision Document — SikaFlow

_Ce document se construit de manière collaborative à travers une découverte étape par étape. Les sections sont ajoutées au fur et à mesure que nous travaillons ensemble sur chaque décision architecturale._

## Analyse du Contexte Projet

### Vue d'Ensemble des Exigences

**Exigences Fonctionnelles :**

SikaFlow couvre **8 domaines fonctionnels majeurs** avec **~19 handlers d'action** :

| Domaine          | Capacités Clés                                                              | Impact Architectural                            |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| **Organisation** | Multi-entités, RBAC (Owner/Manager/Staff), Switch contexte                  | Multi-tenancy, isolation des données            |
| **Transactions** | Saisie multimodale (texte, vocal, photo), catégorisation IA, dettes/crédits | Pipeline IA, stratégies de messages             |
| **Ticketing**    | Événements, QR codes, Claim/Scan, gestion capacité                          | Crypto (hash), médias, liens sécurisés          |
| **Abonnements**  | SaaS mensuel + Event Pass, Stripe + Wave                                    | Dual payment providers, webhooks tiers          |
| **Reporting**    | Flash/Daily/Weekly PDF, envoi automatique                                   | Jobs planifiés, génération PDF, files d'attente |
| **Onboarding**   | Tutoriel 5 étapes, progression persistée, filtrage rôle                     | State machine, boutons interactifs              |
| **Feedback**     | Collecte post-événement, rating, boutons interactifs                        | Scheduler automatique, WhatsApp Interactive     |
| **Auth**         | Magic Link WhatsApp, JWT, Guards hybrides                                   | Auth sans mot de passe, sécurité API            |

**Exigences Non-Fonctionnelles :**

| NFR                     | Détail                                                            | Criticité      |
| ----------------------- | ----------------------------------------------------------------- | -------------- |
| **Latence**             | Webhook doit répondre en <2s (exigence Meta)                      | 🔴 Critique    |
| **Résilience**          | File d'attente asynchrone (BullMQ/Redis) pour éviter les timeouts | 🔴 Critique    |
| **Sécurité**            | Validation HMAC des webhooks, hash crypto billets, RBAC           | 🔴 Critique    |
| **Multi-plateforme**    | WhatsApp + Telegram (adaptateur unifié)                           | 🟡 Important   |
| **Précision IA**        | Zéro hallucination sur les totaux financiers                      | 🔴 Critique    |
| **Scalabilité**         | Multi-organisation, multi-utilisateurs concurrents                | 🟡 Important   |
| **Compliance WhatsApp** | Taux de blocage <1%, messages utilitaires uniquement              | 🔴 Existentiel |

**Échelle & Complexité :**

- Domaine principal : Full-stack (Backend API-first + Frontend Dashboard)
- Niveau de complexité : **Élevé (High)**
- Composants architecturaux estimés : ~15 modules backend + 4 zones frontend
- Indicateurs :
  - Multi-tenancy (multi-organisations par utilisateur)
  - IA Multimodale (texte, audio, image, documents)
  - Intégrations tierces multiples (WhatsApp, Telegram, Gemini, Stripe, Wave)
  - Traitement asynchrone (BullMQ + Redis)
  - Dual payment providers (EUR + FCFA)
  - Jobs planifiés (rapports automatiques)

### Contraintes Techniques & Dépendances

1. **Architecture Hexagonale stricte** — Domaine pur (POJOs), pas de dépendances ORM dans le domaine, DI via interfaces/tokens
2. **NestJS + MikroORM + PostgreSQL** — Stack backend verrouillée
3. **Next.js 15 (App Router) + CSS Modules** — Stack frontend verrouillée
4. **Dépendance Meta (WhatsApp Cloud API)** — Risque existentiel de ban
5. **Telegram comme failover** — Architecture déjà modulaire via `IMessageStrategy`
6. **Google Vertex AI (Gemini)** — LLM provider unique, interface abstraite `ILLMProvider`

### Préoccupations Transversales Identifiées

1. **Authentification & Autorisation** — RBAC vérifié sur chaque action, guards hybrides (API Key + JWT)
2. **Abstraction Messaging** — Interface unifiée WhatsApp/Telegram (Strategy Pattern)
3. **Pipeline IA** — Extraction d'intention → Dispatch vers Handler (Chain of Responsibility)
4. **Observabilité** — Logs, monitoring Quality Score WhatsApp
5. **Gestion des erreurs** — Retry, dead-letter queue, graceful degradation
6. **Internationalisation** — Multi-zone (Afrique, Québec, France), multi-devise (EUR, FCFA, CAD)

## Évaluation du Starter Template

### Domaine Technologique Principal

**Full-stack (Backend API-first + Frontend Dashboard)** — Projet existant et opérationnel, pas de starter template nécessaire.

### Stack Technologique Établi

SikaFlow est un projet mature au-delà de la phase "starter". Les décisions technologiques sont déjà prises et opérationnelles :

| Catégorie                 | Choix Établi                         |
| ------------------------- | ------------------------------------ |
| **Backend Framework**     | NestJS                               |
| **ORM**                   | MikroORM (EntitySchema, domaine pur) |
| **Base de données**       | PostgreSQL                           |
| **Queue / Async**         | BullMQ + Redis                       |
| **Frontend Framework**    | Next.js 15 (App Router)              |
| **Styling**               | CSS Modules (`.module.css`)          |
| **State Management**      | React Hooks + Zustand (si global)    |
| **Langage**               | TypeScript Strict                    |
| **LLM Provider**          | Google Vertex AI (Gemini)            |
| **Paiements**             | Stripe + Wave                        |
| **Messaging**             | WhatsApp Cloud API + Telegram        |
| **Architecture Backend**  | Hexagonal (Ports & Adapters) strict  |
| **Architecture Frontend** | Feature-Sliced Design simplifié      |

### Décisions Architecturales Héritées du Stack

**Backend (NestJS Hexagonal) :**

- Structure modulaire en 15+ modules indépendants
- Domaine pur (POJOs) — pas de decorators ORM dans le domaine
- DI via interfaces/tokens (`I_*_REPOSITORY`)
- Strategy Pattern pour les messages (7 stratégies)
- Chain of Responsibility pour les handlers (19 handlers)
- Event-driven (EventEmitter) pour la communication inter-modules
- Jobs planifiés via `ScheduleModule`

**Frontend (Next.js 15) :**

- Server Components par défaut, `"use client"` uniquement si nécessaire
- Smart vs Dumb Components (`features/` vs `components/`)
- Services dédiés pour les appels API (jamais de fetch direct)
- Custom Hooks pour la logique (Single Responsibility)

**Testing :**

- Jest (backend, fichiers `.spec.ts`)
- `FakeLLMProvider` pour les tests unitaires IA

**Déploiement :**

- Docker (scripts de déploiement et checklist existants)

### Recommandation

Aucun changement de starter template n'est recommandé. Le focus architectural doit porter sur la **formalisation et la consolidation** des décisions existantes pour guider les futures évolutions (dashboard web, CRM, nouveaux modules).

## Décisions Architecturales Fondamentales

### Analyse des Priorités

**Décision Critique (Bloque l'évolution) :**

- Migration de l'orchestration agent vers ZeroClaw

**Décisions Importantes (Façonnent l'architecture) :**

- Exposition REST API pure du backend
- Stratégie de communication ZeroClaw ↔ Backend
- Stratégie multi-tenant vs multi-instance

**Décisions Différées (Post-MVP) :**

- Dashboard web (Next.js) → après validation POC agent
- CRM / Module marketing → après traction commerciale
- MCP natif → en attente de support par ZeroClaw

### Orchestration Agent : Migration vers ZeroClaw

**Décision** : Remplacer l'`AgentOrchestratorService` custom (NestJS + LangChain tools) par **ZeroClaw** (runtime agent Rust)

**Rationale** :

- Séparer l'intelligence IA du backend métier (SRP)
- Bénéficier du support natif WhatsApp/Telegram sans code custom
- Mémoire conversationnelle intégrée (PostgreSQL)
- Provider-agnostique (Gemini, Claude, GPT-4, Ollama)
- Ultra-léger (<5MB RAM, <10ms cold start)

**Affecte** : Modules `webhook`, `agent`, `common/llm`, `common/whatsapp`, `common/telegram`

**Approche POC** : Détaillée dans `poc-zeroclaw-plan.md` (approuvé)

### Data Architecture

| Décision            | Choix                                  | Rationale                        |
| ------------------- | -------------------------------------- | -------------------------------- |
| **Base de données** | PostgreSQL (inchangé)                  | Déjà en production, mature       |
| **ORM**             | MikroORM EntitySchema (inchangé)       | Domaine pur, séparation concerns |
| **Migrations**      | MikroORM migrations (inchangé)         | Pipeline CI/CD existant          |
| **Validation**      | class-validator (backend)              | Standard NestJS                  |
| **Caching**         | Redis via BullMQ (inchangé)            | Déjà en place pour les queues    |
| **Mémoire agent**   | PostgreSQL via ZeroClaw memory backend | Partage la même instance PG      |

### Authentification & Sécurité

| Décision           | Choix                                         | Rationale                                          |
| ------------------ | --------------------------------------------- | -------------------------------------------------- |
| **Auth messaging** | Phone-based (WhatsApp/Telegram = identifiant) | Inchangé, géré par ZeroClaw channels               |
| **Auth dashboard** | Magic Link + JWT (inchangé)                   | Module auth existant                               |
| **Auth API (M2M)** | API Key Guard (inchangé)                      | ZeroClaw → Backend via API Key                     |
| **RBAC**           | Owner/Manager/Staff (inchangé)                | Vérifié côté backend, pas côté agent               |
| **Webhooks**       | HMAC signature (géré par ZeroClaw)            | ZeroClaw valide les signatures WhatsApp nativement |
| **Secrets**        | `.env` + ZeroClaw encrypted secrets           | Double couche de protection                        |

### API & Communication

| Décision               | Choix                                            | Rationale                             |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| **ZeroClaw → Backend** | REST HTTP (via `http_request` tool)              | Simple, découplé, testable            |
| **Format API**         | JSON, endpoints RESTful                          | Standard, outillage mature            |
| **Error handling**     | Format uniforme `{ error, message, statusCode }` | Convention NestJS                     |
| **Rate limiting**      | Côté ZeroClaw (gateway) + NestJS throttle        | Double protection                     |
| **Documentation**      | Swagger/OpenAPI auto-généré                      | Facilite l'intégration ZeroClaw tools |

### Frontend Architecture (Dashboard Web)

| Décision      | Choix                                               | Rationale                   |
| ------------- | --------------------------------------------------- | --------------------------- |
| **Framework** | Next.js 15 App Router (inchangé)                    | Déjà configuré              |
| **State**     | React Hooks + Zustand (inchangé)                    | Léger, adapté               |
| **Rendering** | SSR pour les pages publiques, CSR pour le dashboard | Performance + interactivité |
| **Styling**   | CSS Modules (inchangé)                              | Isolation, pas de runtime   |

> ⚠️ Le dashboard web est **différé** jusqu'à validation du POC ZeroClaw.

### Infrastructure & Déploiement

| Décision             | Choix                                  | Rationale                             |
| -------------------- | -------------------------------------- | ------------------------------------- |
| **Hosting**          | VPS (inchangé pour le moment)          | Coût maîtrisé                         |
| **Conteneurisation** | Docker Compose (existant + ZeroClaw)   | Un seul `docker-compose.yml`          |
| **CI/CD**            | GitHub Actions (existant)              | Build, test, deploy auto              |
| **Monitoring**       | Logs fichiers + Health endpoints       | À améliorer post-POC                  |
| **Scaling**          | Monolithique → évaluer après POC       | Multi-instance ZeroClaw si nécessaire |
| **Multi-tenant**     | 1 instance ZeroClaw multi-tenant (POC) | Routing par phoneNumber → orgId       |

### Impact sur l'Implémentation

**Séquence recommandée :**

1. Exposer les endpoints REST manquants du backend (Phase 0)
2. Installer et configurer ZeroClaw (Phase 1)
3. Développer les tools HTTP / system prompt (Phase 2)
4. Tester end-to-end (Phase 3)
5. Évaluer Go/No-Go (Phase 4)
6. Si Go → migration progressive du webhook actuel
7. Dashboard web (post-migration)

**Dépendances inter-décisions :**

- ZeroClaw **dépend de** l'API REST backend → Phase 0 obligatoire
- Dashboard web **dépend de** la stabilisation de l'API → après POC
- Multi-instance **dépend de** la validation du modèle single-instance → Phase 4

## Patterns d'Implémentation & Règles de Consistance

### Points de Conflit Identifiés

**12 zones** où des agents IA pourraient faire des choix différents, toutes résolues ci-dessous.

### Naming Patterns

**Base de données :**

- Tables : `snake_case` pluriel (`transactions`, `contacts`, `events`)
- Colonnes : `snake_case` (`phone_number`, `organization_id`, `created_at`)
- Foreign keys : `{table}_id` (`organization_id`, `contact_id`)
- Index : `idx_{table}_{column}` (`idx_transactions_phone_number`)

**API REST :**

- Endpoints : `kebab-case` pluriel (`/api/transactions`, `/api/events`)
- Path params : `camelCase` (`:orgId`, `:eventId`)
- Query params : `camelCase` (`?phoneNumber=...&organizationId=...`)
- Headers custom : `X-Prefixed` (`X-API-Key`, `X-Phone-Number`, `X-Org-Id`)

**Code Backend :**

- Modules : `kebab-case` (`src/transaction/`, `src/debt/`)
- Fichiers : `kebab-case.suffix.ts` (`create-transaction.use-case.ts`)
- Classes : `PascalCase` (`CreateTransactionUseCase`)
- Interfaces : `PascalCase` préfixé `I` (`ITransactionRepository`)
- Tokens DI : `SCREAMING_SNAKE` (`I_TRANSACTION_REPOSITORY`)
- Variables/fonctions : `camelCase` (`phoneNumber`, `createTransaction`)

**Code Frontend :**

- Dossiers : `kebab-case` (`user-profile/`)
- Composants : `PascalCase.tsx` (`TransactionList.tsx`)
- Hooks : `camelCase` préfixé `use` (`useTransactions`)
- Services : `camelCase.service.ts` (`transaction.service.ts`)
- Styles : `ComponentName.module.css` (`TransactionList.module.css`)

### Structure Patterns

**Backend — Module hexagonal :**

```
src/{module}/
├── domain/
│   ├── {entity}.entity.ts         # POJO pur (PAS d'annotations ORM)
│   ├── ports/                     # Interfaces repositories & services
│   └── exceptions/                # Exceptions métier
├── application/
│   ├── use-cases/                 # CQS (1 classe = 1 use case)
│   ├── dtos/                      # Input/Output DTOs
│   └── handlers/                  # Event/Command handlers
└── infrastructure/
    ├── persistence/               # EntitySchema + Repository implementations
    ├── web/                       # Controllers REST
    └── adapters/                  # Services externes
```

**Frontend — Feature-Sliced Design :**

```
src/features/{feature}/
├── components/                    # Smart components (connectés aux hooks)
├── hooks/                         # Custom hooks (logique métier)
├── services/                      # Appels API typés (jamais fetch direct)
└── types/                         # Types locaux
```

**Tests :**

- Backend : co-localisés `*.spec.ts` à côté du fichier testé
- Frontend : co-localisés `*.test.tsx` à côté du composant

### Format Patterns

**Réponse API (succès)** : Réponse directe sans wrapper

```json
// GET /api/transactions → tableau
[{ "id": "uuid", "amount": 5000, "type": "EXPENSE" }]

// POST /api/transactions → objet créé
{ "id": "uuid", "amount": 5000, "type": "EXPENSE", "createdAt": "2026-02-23T22:00:00Z" }
```

**Réponse API (erreur)** : Format NestJS standard

```json
{
  "statusCode": 400,
  "message": "Le montant est requis",
  "error": "Bad Request"
}
```

**Formats de données :**

- JSON : `camelCase` pour les champs
- Dates : ISO 8601 strings (`"2026-02-23T22:00:00Z"`)
- IDs : UUID v4 (strings)
- Booléens : `true`/`false` (jamais 1/0)
- Nulls : `null` explicite (jamais omis)
- Montants : `number` en centimes ou unité de base (5000 = 5000 FCFA)

### Communication Patterns

**Events (EventEmitter NestJS)** :

- Naming : `dot.notation` minuscule (`transaction.created`, `debt.settled`, `event.updated`)
- Payload : toujours un objet typé avec au minimum `{ id, timestamp }`
- Pattern : fire-and-forget (async, pas de retour attendu)

**ZeroClaw → Backend** :

- Auth : Header `X-API-Key: {clé_api}`
- Contexte utilisateur : Headers `X-Phone-Number: +225...` et `X-Org-Id: uuid`
- Content-Type : `application/json`
- Réponses : JSON avec les mêmes formats que ci-dessus

### Process Patterns

**Error Handling :**

- Exceptions métier : classes dans `domain/exceptions/` (ex: `InsufficientStockException`)
- Catch global : `ExceptionFilter` NestJS (transforme en HTTP response)
- Logging erreur : `Logger.error()` avec stack trace
- Côté ZeroClaw : retry 1x, puis message utilisateur "une erreur s'est produite"

**Logging :**

- Format : JSON structuré via `NestJS Logger`
- Niveaux : `debug` (détail), `log` (info opérationnel), `warn` (dégradation), `error` (échec + stack)
- Contexte obligatoire : nom du module, phoneNumber si disponible
- Pattern : `this.logger.log(\`Action description\`, ModuleName.name)`

**Validation :**

- Backend : `class-validator` sur les DTOs (couche application)
- Frontend : Zod pour la validation client
- Validation toujours côté serveur, jamais faire confiance au client

### Règles Obligatoires pour Tous les Agents IA

1. **Domaine pur** : AUCUNE annotation ORM dans `domain/` — les entités sont des POJOs
2. **DI via interfaces** : jamais injecter une classe concrète directement
3. **1 use case = 1 classe** : pas de God Service
4. **Tests co-localisés** : `*.spec.ts` à côté du fichier testé
5. **Pas de `any`** : TypeScript strict, utiliser `unknown` + validation
6. **Events en dot.notation** : `module.action` (ex: `debt.created`)
7. **API REST directe** : pas de wrapper, format NestJS erreurs standard

### Anti-Patterns à Éviter

- ❌ Annotations `@Entity()` dans le domaine
- ❌ `fetch()` direct dans les composants React
- ❌ God Components >200 lignes
- ❌ Hardcoded strings (utiliser constantes ou i18n)
- ❌ Deep prop drilling (utiliser Zustand ou Context)
- ❌ Logique métier dans les controllers (doit être dans les use-cases)
