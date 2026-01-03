# 🚀 EventPilot (v2.0)

**The AI-Powered Orchestration OS for Modern Event Management**

EventPilot est une plateforme "WhatsApp-First" conçue pour digitaliser la gestion opérationnelle et financière des événements. Elle utilise une **Intelligence Artificielle Multimodale (Gemini)** pour transformer conversations, images et documents en données structurées.

## 🌍 Vision & Dual Market

- **Afrique Francophone** : Gestion du cash, Mobile Money, rapports sponsors (Concerts, Matchs).
- **Québec (Montréal)** : Nightlife, conformité taxes/tips, sécurité (RACJ).

---

## 🏗️ Architecture Technique

Le projet repose sur une **Architecture Hexagonale Stricte (Ports & Adapters)** et une stack robuste :

- **Framework** : [NestJS](https://nestjs.com/) (Modularité, Injection de Dépendances).
- **ORM** : [MikroORM](https://mikro-orm.io/) (Data Mapper pattern, Entités du Domaine pures).
- **Async Processing** : [BullMQ](https://docs.bullmq.io/) sur [Redis](https://redis.io/) (Traitement asynchrone des Webhooks et Rapports).
- **IA** : [Google Gemini](https://deepmind.google/technologies/gemini/) (Analyse Texte & Vision).
- **Interface** : [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) (Webhook).

Consultez le [Diagramme d'Architecture détaillé](docs/architecture.md) pour plus d'infos.

---

## ✨ Fonctionnalités Clés (Implémentées)

- **📱 WhatsApp Webhook** : Réception temps réel, validation de signature.
- **🧠 Analyse IA Avancée** :
  - Détection Multi-Intentions (Transaction, Incident, Rapport).
  - Extraction de données structurées (Montant, Catégorie, Sévérité).
  - Gestion du contexte conversationnel.
- **🖼️ Vision & Documents** :
  - Analyse de photos (Incidents, Reçus).
  - Analyse de PDF (Factures fournisseurs).
- **⚡ Traitement Asynchrone** :
  - Architecture non-bloquante pour scaler sous la charge.
  - Files d'attente séparées (`whatsapp`, `reports`).

---

## 🚀 Installation & Démarrage

### 1. Pré-requis

- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (v6+)
- Une clé API Google Gemini (`GOOGLE_API_KEY`)
- Un token WhatsApp Cloud API (pour le dev)

### 2. Configuration (`.env`)

Dupliquez le fichier `.env.example` (ou créez-en un) :

```env
# APP
PORT=3000
NODE_ENV=development

# DATABASE (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=eventpilot

# REDIS (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# WHATSAPP
WHATSAPP_ACCESS_TOKEN=votre_token
WHATSAPP_VERIFY_TOKEN=votre_verify_token
WHATSAPP_PHONE_NUMBER_ID=votre_phone_id

# AI (Gemini)
GOOGLE_API_KEY=votre_api_key
GEMINI_MODEL_NAME=gemini-1.5-flash
AI_CONFIDENCE_THRESHOLD=0.85

# PAYMENT (Stripe pour Canada, Wave pour Afrique)
PAYMENT_REGION=INTERNATIONAL  # ou AFRICA pour activer Wave
STRIPE_SECRET_KEY=sk_test_...
WAVE_API_KEY=wave_sn_prod_...
APP_URL=https://eventpilot.app  # URL de callback après paiement
```

### 3. Installation des dépendances

```bash
npm install
```

### 4. Base de Données (Migration)

```bash
# Générer le schéma initial & Appliquer les migrations
npm run migration:up
```

_Note : Un script de migration `01-create-prompt-template.sql` s'exécutera automatiquement pour peupler les prompts IA par défaut._

### 5. Lancement

```bash
# Mode Développement (Watch)
npm run start:dev

# Mode Production
npm run build
npm run start:prod
```

---

## 🧪 Tests & Qualité

- **Linting** : `npm run lint`

## 🤝 Contribution

Toute contribution doit respecter l'Achitecture Hexagonale :

- **Domain** : Pas de dépendances framework. POJOs purs.
- **Application** : UseCases, ports d'entrée.
- **Infrastructure** : Implémentations concrètes (Adapters), Controllers, OrmEntities.

---

_Built with ❤️ by the Antigravity Team._
