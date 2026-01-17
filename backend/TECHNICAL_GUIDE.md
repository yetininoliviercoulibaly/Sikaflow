# 📘 Guide Technique du Développeur - SikaFlow (Backend)

Ce document est destiné aux développeurs souhaitant comprendre, installer et contribuer au projet **SikaFlow**.

## 🏗️ Architecture & Stack Technique

Le projet repose sur une **Architecture Hexagonale (Ports & Adapters)** stricte pour garantir la testabilité et l'indépendance vis-à-vis des frameworks.

### Stack

| Composant           | Technologie                  |
| ------------------- | ---------------------------- |
| **Runtime**         | Node.js 18+ (via NestJS)     |
| **Langage**         | TypeScript                   |
| **ORM**             | MikroORM (Driver PostgreSQL) |
| **Base de Données** | PostgreSQL 15+               |
| **Queueing**        | Redis + BullMQ               |
| **IA**              | Google Gemini (Vertex AI)    |
| **Paiements**       | Stripe + Wave                |
| **Scheduling**      | @nestjs/schedule             |
| **Events**          | @nestjs/event-emitter        |

### Structure des Dossiers (`src/`)

L'application est découpée par **Modules Métiers** (Domain-Driven Design) :

```text
src/
├── common/             # Services partagés
│   ├── llm/            # Providers LLM (Gemini, Fake)
│   ├── whatsapp/       # Service WhatsApp
│   ├── guards/         # Guards sécurité
│   ├── middleware/     # Middlewares
│   └── prompt/         # Gestion prompts dynamiques
├── organization/       # Gestion des Établissements
├── user/               # Utilisateurs WhatsApp
├── transaction/        # Gestion Financière
├── incident/           # Main Courante
├── subscription/       # Abonnements SaaS & Event Pass
├── ticketing/          # Événements & Billetterie
├── payment/            # Intégration Stripe & Wave
├── report/             # Génération PDF
├── feedback/           # Collecte notes post-événement
├── onboarding/         # Tutoriel interactif 5 étapes
├── webhook/            # Point d'entrée WhatsApp
│   └── application/
│       ├── controllers/    # WhatsAppController
│       ├── strategies/     # 7 stratégies de messages
│       ├── handlers/       # 19 action handlers
│       └── processors/     # BullMQ processors
├── database/           # Migrations & Seeders
├── main.ts             # Point d'entrée
├── app.module.ts       # Module Racine
└── mikro-orm.config.ts # Configuration ORM
```

### Pattern Hexagonal (par module)

Chaque module (ex: `organization`) suit cette structure :

1.  **`domain/`** : Le Coeur du Métier.
    - **Entities** : Classes TypeScript pures (ex: `Organization`). _Aucune annotation ORM ici._
    - **Ports** : Interfaces définissant les interactions (ex: `IOrganizationRepository`).
2.  **`application/`** : Les Use Cases.
    - Use Cases orchestrant la logique métier.
3.  **`infrastructure/`** : Les Détails Techniques.
    - **Persistence** : Implémentation MikroORM.
      - `*.schema.ts` : Mapping `EntitySchema` (lie la classe pure à la DB).
      - `mikro-orm-*.repository.ts` : Implémente le Port du Domaine.

---

## 🚀 Installation & Démarrage

### Pré-requis

- Node.js 18+
- PostgreSQL local ou Dockerisé
- Redis local ou Dockerisé (Requis pour la queue asynchrone)
- npm

### Étapes

1.  **Installer les dépendances**

    ```bash
    npm install
    ```

2.  **Configuration Environnement**
    Créez un fichier `.env` à la racine (voir `env.example`).

    ```bash
    # Database
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_NAME=event_pilot_db

    # Redis
    REDIS_HOST=localhost
    REDIS_PORT=6379

    # WhatsApp
    WHATSAPP_TOKEN=your_token
    WHATSAPP_PHONE_ID=your_phone_id
    WHATSAPP_VERIFY_TOKEN=my_secure_verify_token_123

    # Gemini
    GOOGLE_GEMINI_API_KEY=your_api_key

    # Stripe
    STRIPE_SECRET_KEY=sk_...
    STRIPE_WEBHOOK_SECRET=whsec_...

    # Wave (Optionnel)
    WAVE_API_KEY=your_wave_key
    ```

3.  **Lancer en mode développement**

    ```bash
    npm run start:dev
    ```

4.  **Lancer avec Docker Compose**
    ```bash
    docker-compose up -d
    ```

---

## 🗄️ Modèle de Données (SQL)

Voici le schéma de la base de données PostgreSQL généré pour le projet.

> **Note** : Les tables sont au singulier (`user`, `organization`, ...) et utilisent des UUIDs.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE subscription_type AS ENUM ('MONTHLY');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED');
CREATE TYPE message_type AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'DOCUMENT', 'INTERACTIVE');
CREATE TYPE message_status AS ENUM ('RECEIVED', 'PROCESSED', 'ERROR');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE incident_status AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE report_type AS ENUM ('FLASH', 'WEEKLY', 'DAILY');
CREATE TYPE ticket_status AS ENUM ('VALID', 'USED', 'CANCELLED');
CREATE TYPE onboarding_step_id AS ENUM ('WELCOME', 'CREATE_FIRST_TRANSACTION', 'ADD_TEAM_MEMBER', 'GENERATE_REPORT', 'SUBSCRIBE');

-- Tables Principales

CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    last_active_organization_id UUID,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES "user"(id),
    settings JSONB DEFAULT '{}',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    current_plan_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_member (
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'STAFF',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, user_id)
);

-- Abonnements

CREATE TABLE subscription_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    features JSONB DEFAULT '[]',
    stripe_price_id VARCHAR(255)
);

CREATE TABLE subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    type subscription_type NOT NULL DEFAULT 'MONTHLY',
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    stripe_subscription_id VARCHAR(255),
    wave_transaction_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_pass (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    duration_hours INTEGER NOT NULL DEFAULT 48,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billetterie

CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_capacity INTEGER NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    sold_count INTEGER DEFAULT 0,
    feedback_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    attendee_phone VARCHAR(50),
    status ticket_status NOT NULL DEFAULT 'VALID',
    secure_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ticket_claim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES ticket(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    claim_url TEXT,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions & Incidents

CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    reported_by_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    origin_message_id UUID,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    category VARCHAR(50),
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    reported_by_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    origin_message_id UUID,
    severity incident_severity DEFAULT 'MEDIUM',
    description TEXT,
    status incident_status DEFAULT 'OPEN',
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback & Onboarding

CREATE TABLE event_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    attendee_phone VARCHAR(50) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    completed_steps JSONB DEFAULT '[]',
    current_step onboarding_step_id,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

CREATE TABLE onboarding_step_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id onboarding_step_id NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    required_roles JSONB DEFAULT '["OWNER", "MANAGER", "STAFF"]',
    "order" INTEGER NOT NULL,
    tip_message TEXT,
    completion_message TEXT
);

-- Rapports

CREATE TABLE report (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    type report_type NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing
CREATE INDEX idx_user_phone ON "user"(phone_number);
CREATE INDEX idx_org_member_user ON organization_member(user_id);
CREATE INDEX idx_transaction_org_date ON transaction(organization_id, transaction_date);
CREATE INDEX idx_incident_org_status ON incident(organization_id, status);
CREATE INDEX idx_subscription_org_status ON subscription(organization_id, status);
CREATE INDEX idx_event_org_date ON event(organization_id, date);
CREATE INDEX idx_ticket_event ON ticket(event_id);
CREATE INDEX idx_ticket_hash ON ticket(secure_hash);
CREATE INDEX idx_feedback_event ON event_feedback(event_id);
CREATE INDEX idx_onboarding_user_org ON onboarding_progress(user_id, organization_id);
```

---

## 🛠️ Contrats & Interfaces Clés

### LLM Provider

Le système est conçu pour être agnostique du fournisseur d'IA.

- **Token** : `LLM_PROVIDER_TOKEN`
- **Interface** : `ILLMProvider`
  - `analyzeText(text, prompt)` → Analyse d'intention multi-actions
  - `analyzeMedia(base64Data, mimeType, prompt)` → OCR intelligent
- **Implémentations** :
  - `GeminiLLMProvider` : Production (Google Gemini)
  - `FakeLLMProvider` : Tests unitaires

### Message Strategies

7 stratégies de traitement selon le type de message :

| Stratégie                    | Type WhatsApp | Traitement                           |
| ---------------------------- | ------------- | ------------------------------------ |
| `TextMessageStrategy`        | text          | Analyse LLM                          |
| `AudioMessageStrategy`       | audio         | Transcription + Analyse              |
| `ImageMessageStrategy`       | image         | Download + Analyse multimodale       |
| `DocumentMessageStrategy`    | document      | Download + OCR                       |
| `InteractiveMessageStrategy` | interactive   | Parse boutons (Onboarding, Feedback) |

### Action Handlers

19 handlers implémentant `IActionHandler` :

| Intent LLM             | Handler                     |
| ---------------------- | --------------------------- |
| `CREATE_ORGANIZATION`  | `CreateOrganizationHandler` |
| `SWITCH_ORGANIZATION`  | `SwitchOrganizationHandler` |
| `ADD_MEMBER`           | `AddMemberHandler`          |
| `CREATE_TRANSACTION`   | `CreateTransactionHandler`  |
| `CREATE_EVENT`         | `CreateEventHandler`        |
| `GENERATE_CLAIM_LINKS` | `GenerateClaimHandler`      |
| `CLAIM_TICKET`         | `ClaimTicketHandler`        |
| `SCAN_TICKET`          | `ScanTicketHandler`         |
| `CHECK_STOCK`          | `CheckStockHandler`         |
| `SUBSCRIBE`            | `SubscribeHandler`          |
| `SUBSCRIBE_MONTHLY`    | `SubscribeMonthlyHandler`   |
| `ACTIVATE_EVENT_PASS`  | `ActivateEventPassHandler`  |
| `GENERATE_REPORT`      | `GenerateReportHandler`     |
| `GREETING`             | `GreetingHandler`           |
| `HELP`                 | `HelpHandler`               |

---

## 📱 Configuration WhatsApp (Meta for Developers)

Pour que le Webhook fonctionne, vous devez configurer une application sur Meta for Developers.

### 1. Création de l'App

1.  Allez sur [Meta for Developers](https://developers.facebook.com/).
2.  Créez une nouvelle app de type **Business**.
3.  Ajoutez le produit **WhatsApp** à votre app.

### 2. Configuration du Webhook

1.  Dans le menu latéral, allez dans **WhatsApp > Configuration**.
2.  Cliquez sur **Edit** dans la section Webhook.
3.  **Callback URL** : L'URL publique de votre API (ex: `https://votre-url-ngrok.io/webhook`).
    - _Note_ : En local, utilisez **ngrok** (`ngrok http 3000`) pour exposer votre port 3000.
4.  **Verify Token** : La chaîne de caractères définie dans votre `.env` sous `WHATSAPP_VERIFY_TOKEN`.
    - _Exemple_ : `my_secure_verify_token_123`
5.  Cliquez sur **Verify and Save**.

### 3. Abonnement aux Événements

1.  Une fois le webhook vérifié, cliquez sur **Manage** (Gérer) dans la section Webhook.
2.  Abonnez-vous (Subscribe) aux événements suivants :
    - `messages` (Requis pour recevoir les textes, audios, images)

### 4. Test (Sandbox)

1.  Allez dans **WhatsApp > API Setup**.
2.  Utilisez le **Test Number** fourni par Meta.
3.  Envoyez un message à ce numéro depuis votre WhatsApp personnel pour initialiser la session (24h).
4.  Vous pouvez maintenant envoyer des messages au bot.

---

## 💳 Configuration Paiements

### Stripe

1. Créez un compte sur [Stripe Dashboard](https://dashboard.stripe.com/).
2. Récupérez vos clés API (mode test).
3. Configurez les webhooks Stripe vers `/webhook/stripe`.
4. Créez un Product et Price pour l'abonnement mensuel.

### Wave (Afrique de l'Ouest)

1. Inscrivez-vous sur [Wave Business](https://www.wave.com/).
2. Obtenez votre clé API.
3. Configurez les callbacks vers `/webhook/wave`.
