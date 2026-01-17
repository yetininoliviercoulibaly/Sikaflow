# 🚀 SikaFlow (MVP)

**The AI-Powered Orchestration OS for Modern Event Management**

SikaFlow est une plateforme "WhatsApp-First" conçue pour digitaliser la gestion opérationnelle et financière des événements. Elle utilise une **Intelligence Artificielle Multimodale (Gemini)** pour transformer conversations, images et documents en données structurées.

## 🌍 Vision & Dual Market

- **Afrique Francophone** : Gestion du cash, Mobile Money (Wave), rapports sponsors (Concerts, Matchs).
- **Québec (Montréal)** : Nightlife, conformité taxes/tips, sécurité (RACJ).

---

## 🏗️ Architecture Technique

Le projet repose sur une **Architecture Hexagonale Stricte (Ports & Adapters)** et une stack robuste :

| Composant     | Technologie                                                                   | Rôle                                 |
| :------------ | :---------------------------------------------------------------------------- | :----------------------------------- |
| **Framework** | [NestJS](https://nestjs.com/)                                                 | Modularité, Injection de Dépendances |
| **ORM**       | [MikroORM](https://mikro-orm.io/)                                             | Data Mapper, Entités pures           |
| **Queue**     | [BullMQ](https://docs.bullmq.io/) + Redis                                     | Traitement asynchrone                |
| **IA**        | [Google Gemini](https://deepmind.google/technologies/gemini/)                 | Analyse Texte & Vision               |
| **Interface** | [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) | Webhook temps réel                   |
| **Paiements** | Stripe (International) / Wave (Afrique)                                       | Abonnements & Event Pass             |

Consultez le [Diagramme d'Architecture détaillé](docs/architecture.md) pour plus d'infos.

---

## ✨ Fonctionnalités Clés

### 🎯 Core Platform

| Fonctionnalité               | Description                                   |
| :--------------------------- | :-------------------------------------------- |
| **📱 WhatsApp & Telegram**   | Réception temps réel, validation de signature |
| **👋 Onboarding Automatisé** | Tutoriel interactif guidé étape par étape     |
| **🧠 IA Multimodale**        | Analyse texte, audio, images et PDF           |
| **📊 Reporting Instantané**  | Génération de rapports PDF à la demande       |

### 🎫 Ticketing & Événements

| Fonctionnalité               | Description                              |
| :--------------------------- | :--------------------------------------- |
| **🎪 Création d'Événements** | "Créer un événement Soirée VIP le 15/01" |
| **🎟️ Génération de Billets** | Claims sécurisés avec QR codes           |
| **📷 Scan de Billets**       | Validation instantanée via photo         |
| **📦 Check Stock**           | Inventaire des billets disponibles       |

### 💬 Engagement Client

| Fonctionnalité             | Description                                     |
| :------------------------- | :---------------------------------------------- |
| **⭐ Feedback Interactif** | Notation 1-5 étoiles post-événement             |
| **🎓 Onboarding Coach**    | Guide les nouveaux utilisateurs automatiquement |
| **🔔 Notifications**       | Rappels et confirmations automatiques           |

### 💳 Monétisation

| Fonctionnalité            | Description                            |
| :------------------------ | :------------------------------------- |
| **📅 Abonnement Mensuel** | SaaS pour établissements fixes         |
| **🎫 Event Pass**         | Paiement unique 48h/72h pour festivals |
| **💸 Multi-Paiements**    | Stripe (Visa/MC) + Wave (Mobile Money) |

---

## 📁 Structure du Projet

Chaque module suit l'**Architecture Hexagonale** stricte :

```
src/
├── common/           # Services partagés (WhatsApp, LLM, Guards)
├── database/         # Migrations & Seeders
├── [module]/
│   ├── domain/           # Entités, Value Objects, Ports (Interfaces)
│   ├── application/      # Use Cases, DTOs, Controllers
│   │   ├── use-cases/    # Logique métier
│   │   ├── dtos/         # Data Transfer Objects
│   │   └── controllers/  # Controllers HTTP (REST API)
│   └── infrastructure/   # Adapters (Persistence, Services externes)
│       └── persistence/  # Schemas ORM, Repositories
│
├── feedback/         # Module de feedback post-événement
├── incident/         # Gestion des incidents
├── onboarding/       # Agent d'onboarding interactif
├── organization/     # Gestion des organisations & membres
├── payment/          # Intégration Stripe/Wave
├── report/           # Génération de rapports PDF
├── subscription/     # Plans d'abonnement & Event Pass
├── ticketing/        # Événements, billets, claims
├── auth/             # Authentification (Magic Link, JWT, Guards)
├── transaction/      # Enregistrement des transactions
├── user/             # Gestion des utilisateurs
└── webhook/          # Webhook WhatsApp & handlers IA
```

---

## 🚀 Installation & Démarrage

### 1. Pré-requis

- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (v6+)
- Clé API Google Gemini
- Token WhatsApp Cloud API
- Token Telegram Bot API

### 2. Configuration (`.env`)

```env
# APP
PORT=3000
NODE_ENV=development

# DATABASE
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=SikaFlow

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379

# WHATSAPP
WHATSAPP_ACCESS_TOKEN=votre_token
WHATSAPP_VERIFY_TOKEN=votre_verify_token
WHATSAPP_PHONE_NUMBER_ID=votre_phone_id

# TELEGRAM
TELEGRAM_BOT_TOKEN=votre_bot_token
TELEGRAM_WEBHOOK_SECRET=votre_webhook_secret
TELEGRAM_BOT_USERNAME=votre_bot_username
BYPASS_SUBSCRIPTION_CHECK=false

# AI (Gemini)
GOOGLE_API_KEY=votre_api_key
GEMINI_MODEL_NAME=gemini-1.5-flash

# PAYMENT
PAYMENT_REGION=INTERNATIONAL  # ou AFRICA
STRIPE_SECRET_KEY=sk_test_...
WAVE_API_KEY=wave_sn_prod_...

# AUTH (Dashboard)
JWT_SECRET=your_jwt_secret
ADMIN_API_KEY=your_admin_key
ADMIN_PHONE_NUMBERS=+33612345678,+221771234567
```

### 3. Lancement

```bash
# Installation
npm install

# Base de données
npm run migration:up
npm run seed:run

# Développement
npm run start:dev

# Production
npm run build && npm run start:prod
```

---

## 🐳 Docker

```bash
# Lancer tous les services (DB + Redis + App)
docker-compose up -d

# Logs
docker-compose logs -f app
```

---

## 🧪 Tests & Qualité

```bash
# Linting
npm run lint

# Build check
npm run build

# E2E Verification (Onboarding Flow)
npx ts-node src/scripts/verify-e2e-onboarding.ts
```

---

## 🤝 Contribution

L'architecture **Hexagonale** doit être respectée :

| Couche             | Règle                                     |
| :----------------- | :---------------------------------------- |
| **Domain**         | Pas de dépendances framework. POJOs purs. |
| **Application**    | UseCases, Ports d'entrée.                 |
| **Infrastructure** | Adapters, Controllers, Schemas ORM.       |

---

## 📚 Documentation

- [Architecture Technique](docs/architecture.md)
- [Guide d'Onboarding Utilisateur](docs/user_onboarding_guide.md)
- [Spécifications Fonctionnelles](docs/functional_specs.md)
- [Pitch Investisseur](docs/investor_deck.md)

---

_Built with ❤️ by the Antigravity Team._
