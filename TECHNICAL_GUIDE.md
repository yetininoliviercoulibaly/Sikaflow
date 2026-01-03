# 📘 Guide Technique du Développeur - Event-Pilot (Backend)

Ce document est destiné aux développeurs souhaitant comprendre, installer et contribuer au projet **Event-Pilot**.

## 🏗️ Architecture & Stack Technique

Le projet repose sur une **Architecture Hexagonale (Ports & Adapters)** stricte pour garantir la testabilité et l'indépendance vis-à-vis des frameworks.

### Stack

- **Runtime** : Node.js (via NestJS)
- **Langage** : TypeScript
- **ORM** : MikroORM (Driver PostgreSQL)
- **Base de Données** : PostgreSQL 15+
- **Queueing** : Redis + BullMQ (Gestion asynchrone)

### Structure des Dossiers (`src/`)

L'application est découpée par **Modules Métiers** (Domain-Driven Design) :

```text
src/
├── common/             # Partagés (LLM, Utils...)
├── organization/       # Gestion des Établissements
├── user/               # Gestion des Utilisateurs WhatsApp
├── transaction/        # Gestion Financière
├── incident/           # Gestion Opérationnelle
├── main.ts             # Point d'entrée
├── app.module.ts       # Module Racine
└── mikro-orm.config.ts # Configuration ORM
```

### Pattern Hexagonal (par module)

Chaque module (ex: `organization`) suit cette structure :

1.  **`domain/`** : Le Coeur du Métier.
    - **Entities** : Classes TypeScript pures (ex: `Organization`). _Aucune annotation ORM ici._
    - **Ports** : Interfaces définissant les interactions (ex: `IOrganizationRepository`).
2.  **`infrastructure/`** : Les Détails Techniques.
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
    Créez un fichier `.env` à la racine (voir `.env.example` ou adapter `mikro-orm.config.ts` via les variables environment).

    ```bash
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_NAME=event_pilot_db
    ```

3.  **Lancer en mode développement**
    ```bash
    npm run start:dev
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
CREATE TYPE subscription_type AS ENUM ('SAAS_MONTHLY', 'EVENT_PASS');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING');
CREATE TYPE message_type AS ENUM ('TEXT', 'AUDIO', 'IMAGE');
CREATE TYPE message_status AS ENUM ('RECEIVED', 'PROCESSED', 'ERROR');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE incident_status AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE report_type AS ENUM ('FLASH', 'WEEKLY');

-- Tables

CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    last_active_organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES "user"(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_member (
    organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'STAFF',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    type subscription_type NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status subscription_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE message (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    type message_type NOT NULL,
    content_text TEXT,
    media_url TEXT,
    whatsapp_message_id VARCHAR(255) UNIQUE,
    processing_status message_status DEFAULT 'RECEIVED',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    reported_by_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    origin_message_id UUID REFERENCES message(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    category VARCHAR(50),
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    reported_by_user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    origin_message_id UUID REFERENCES message(id) ON DELETE SET NULL,
    severity incident_severity DEFAULT 'MEDIUM',
    description TEXT,
    status incident_status DEFAULT 'OPEN',
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX idx_message_org ON message(organization_id);
CREATE INDEX idx_transaction_org_date ON transaction(organization_id, transaction_date);
CREATE INDEX idx_incident_org_status ON incident(organization_id, status);
CREATE INDEX idx_subscription_org_status ON subscription(organization_id, status);
```

## 🛠️ Contrats & Interfaces Clés

### LLM Provider

Le système est conçu pour être agnostique du fournisseur d'IA.

- **Token** : `LLM_PROVIDER_TOKEN`
- **Interface** : `ILLMProvider`
  - `analyzeText(text, context?)`
  - `analyzeImage(imageUrl, prompt?)`
  - `transcribeAudio(audioUrl)`

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
