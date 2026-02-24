---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/planning-artifacts/architecture.md
  - backend/docs/functional_specs.md
  - backend/docs/features.md
  - backend/docs/architecture.md
---

# SikaFlow — Epic Breakdown (POC ZeroClaw)

## Overview

Ce document fournit le découpage en epics et stories pour le **POC ZeroClaw** de SikaFlow, en se concentrant sur les fonctionnalités prioritaires identifiées par le Product Owner : **gestion de caisse** et **recouvrement de dettes**, précédées par l'**onboarding conversationnel**.

## ⚠️ Contexte Technique Critique

> **Le backend SikaFlow existe déjà** avec des modules fonctionnels. Le travail principal est le **câblage vers ZeroClaw**, pas la réécriture du backend.

### État des APIs Existantes

| Module           | Controller existant                         | Endpoints existants                                                                     | Ce qui manque pour ZeroClaw                                       |
| ---------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Organisation** | `OrganizationController` (`/organizations`) | `POST /organizations` (création)                                                        | `GET /organizations?phoneNumber=` (lookup par téléphone)          |
| **Transaction**  | `TransactionController` (`/transactions`)   | `POST /transactions` (création)                                                         | `GET /transactions` (listing + résumé)                            |
| **Dettes**       | ❌ Pas de controller REST                   | Logique dans `DebtHandler` (webhook only)                                               | Créer `DebtController` qui expose les use-cases existants en REST |
| **Media/Audio**  | ❌ Pas de controller REST                   | `MediaStandardizationService.transcribeAudio()` + `GeminiLLMProvider.transcribeAudio()` | Créer `POST /transcribe` endpoint                                 |
| **Auth**         | `AuthController` (`/auth`)                  | Magic Link + JWT                                                                        | Adapter pour accepter API Key de ZeroClaw via `ApiKeyGuard`       |

### Logique Métier Existante (réutiliser, ne pas recréer)

- `CreateOrganizationUseCase` — crée une org (existe)
- `CreateTransactionUseCase` — crée une transaction (existe)
- `DebtHandler` — gère ADD_DEBT, SETTLE_DEBT, LIST_DEBTS, SEND_REMINDER, ADD_CREDIT, LIST_CREDITS (existe dans le module webhook)
- `MediaStandardizationService.transcribeAudio()` — transcrit audio via Gemini (existe)
- `GeminiLLMProvider.transcribeAudio()` — envoie audio base64 à Gemini STT (existe)
- `ApiKeyGuard` — protège les endpoints avec X-API-Key (existe)

### Nature du Travail

- **Stories 1.1–1.3, 2.1–2.4, 3.1–3.5** → Câblage **ZeroClaw** (system prompt, tools, mémoire)
- **Stories 1.4, 2.5, 3.6** → Ajout/adaptation d'**endpoints REST** backend (exposer la logique existante)
- **Story 0.1** → Endpoint transversal de transcription audio (utilisé par toutes les epics)

## Requirements Inventory

### Functional Requirements (extraites des specs fonctionnelles)

- **FR1** : Un nouvel utilisateur peut s'inscrire via WhatsApp/Telegram en répondant à quelques questions conversationnelles
- **FR2** : Le système crée automatiquement une organisation pour le nouvel utilisateur
- **FR3** : L'utilisateur peut enregistrer une dépense par message texte ou vocal
- **FR4** : L'utilisateur peut enregistrer un revenu par message texte ou vocal
- **FR5** : L'utilisateur peut consulter l'état de sa caisse (solde, dernières transactions)
- **FR6** : L'utilisateur peut catégoriser ses transactions (boissons, nourriture, staff, etc.)
- **FR7** : Le système extrait automatiquement le montant et la description via IA
- **FR8** : L'utilisateur peut enregistrer une dette (quelqu'un lui doit de l'argent)
- **FR9** : L'utilisateur peut enregistrer un crédit (il doit de l'argent à quelqu'un)
- **FR10** : L'utilisateur peut consulter la liste de ses dettes/crédits en cours
- **FR11** : L'utilisateur peut marquer une dette comme remboursée
- **FR12** : Le système peut envoyer un rappel automatique à un débiteur
- **FR13** : L'utilisateur reçoit un résumé de fin de journée
- **FR14** : L'utilisateur peut envoyer des messages vocaux (audio) qui sont transcrits automatiquement en texte
- **FR15** : Un utilisateur appartenant à plusieurs organisations bascule intelligemment entre elles (par contexte ou choix explicite)
- **FR16** : Un Owner/Manager peut ajouter/supprimer des membres (Staff/Manager) via message conversationnel

### Non-Functional Requirements

- **NFR1** : Latence réponse < 5s (exigence WhatsApp)
- **NFR2** : Précision extraction IA > 90% (montants, catégories)
- **NFR3** : Disponibilité > 99% (service agent)
- **NFR4** : Coût LLM < $0.01 par message

### Additional Requirements

- **AR1** : Communication via ZeroClaw agent (plus d'orchestrateur custom)
- **AR2** : Backend SikaFlow exposé en REST API pure
- **AR3** : Mémoire conversationnelle via ZeroClaw (PostgreSQL)

### FR Coverage Map

| FR   | Epic        | Description                         |
| ---- | ----------- | ----------------------------------- |
| FR1  | Epic 1      | Inscription conversationnelle       |
| FR2  | Epic 1      | Création automatique d'organisation |
| FR3  | Epic 2      | Enregistrement dépense              |
| FR4  | Epic 2      | Enregistrement revenu               |
| FR5  | Epic 2      | Consultation solde/transactions     |
| FR6  | Epic 2      | Catégorisation des transactions     |
| FR7  | Epic 2      | Extraction IA montant/description   |
| FR8  | Epic 3      | Enregistrement dette                |
| FR9  | Epic 3      | Enregistrement crédit               |
| FR10 | Epic 3      | Liste dettes/crédits                |
| FR11 | Epic 3      | Remboursement dette                 |
| FR12 | Epic 3      | Rappel automatique débiteur         |
| FR13 | Epic 2      | Résumé fin de journée               |
| FR14 | Transversal | Transcription audio (vocaux)        |
| FR15 | Epic 1      | Sélection multi-organisations       |
| FR16 | Epic 1      | Gestion des membres (RBAC)          |

## Epic List

### Epic 1 : Onboarding Conversationnel

Permettre à un nouvel utilisateur de s'inscrire et créer son espace business en quelques messages WhatsApp/Telegram, sans aucun formulaire ni application à télécharger.
**FRs couverts :** FR1, FR2, FR15, FR16
**Dépendances :** Aucune (fondation)

### Epic 2 : Gestion de Caisse

Permettre à un utilisateur de gérer sa trésorerie au quotidien : enregistrer dépenses et revenus par message, consulter son solde, et recevoir des résumés automatiques.
**FRs couverts :** FR3, FR4, FR5, FR6, FR7, FR13
**Dépendances :** Epic 1 (utilisateur doit avoir une organisation)

### Epic 3 : Recouvrement de Dettes

Permettre à un utilisateur de suivre qui lui doit de l'argent, enregistrer les dettes et crédits, marquer les remboursements, et relancer automatiquement les débiteurs.
**FRs couverts :** FR8, FR9, FR10, FR11, FR12
**Dépendances :** Epic 1 (utilisateur doit avoir une organisation)

---

## Epic 0 : Fondation Transversale

**Objectif** : Exposer les services backend transversaux utilisés par toutes les epics (transcription audio).

### Story 0.1 : [NOUVEAU] API Backend — Transcription Audio

As a **ZeroClaw agent**,
I want **un endpoint REST pour transcrire les messages vocaux en texte**,
So that **les utilisateurs puissent interagir par audio comme par texte**.

> **Code existant** : `MediaStandardizationService.transcribeAudio()` (`src/webhook/application/services/media-standardization.service.ts`) + `GeminiLLMProvider.transcribeAudio()` (`src/common/llm/gemini-llm.provider.ts`). La logique complète existe déjà.
> **Travail** : Créer un `TranscriptionController` avec `POST /transcribe` qui câble le service existant.

**Acceptance Criteria:**

**Given** ZeroClaw reçoit un message vocal WhatsApp/Telegram
**When** il envoie `POST /transcribe` avec `{ audioBase64: "...", mimeType: "audio/ogg", phoneNumber: "+225..." }`
**Then** le backend transcrit via `MediaStandardizationService` → Gemini STT
**And** retourne `{ text: "Dépense 5000 pour les boissons" }`
**And** ZeroClaw traite le texte retourné comme un message texte normal

**Given** un audio incompréhensible
**When** Gemini retourne "Audio unclear"
**Then** le backend retourne `{ text: null, error: "audio_unclear" }`
**And** ZeroClaw répond à l'utilisateur : "⚠️ Audio incompréhensible. Merci de répéter ou d'écrire."

---

## Epic 1 : Onboarding Conversationnel

**Objectif** : Un nouvel utilisateur envoie son premier message → ZeroClaw détecte qu'il n'a pas d'organisation → lui pose les bonnes questions → crée son espace automatiquement → le guide vers sa première action.

### Story 1.1 : Détection de Nouvel Utilisateur

As a **nouvel utilisateur WhatsApp/Telegram**,
I want **que le système détecte automatiquement que c'est ma première interaction**,
So that **je sois guidé vers la création de mon espace sans avoir à le demander**.

**Acceptance Criteria:**

**Given** un message entrant d'un numéro inconnu
**When** ZeroClaw interroge l'API backend `GET /api/organizations?phoneNumber={phone}`
**Then** le backend retourne une liste vide
**And** ZeroClaw passe en mode onboarding

### Story 1.2 : Collecte d'Informations Business

As a **nouvel utilisateur**,
I want **répondre à quelques questions simples sur mon activité**,
So that **mon espace soit configuré correctement pour mon type de business**.

**Acceptance Criteria:**

**Given** ZeroClaw est en mode onboarding
**When** l'agent pose les questions : nom du business, type d'activité (maquis, restaurant, bar, événementiel, commerce)
**Then** les réponses sont collectées dans la mémoire conversationnelle
**And** un maximum de 3 questions est posé (pas plus)

### Story 1.3 : Création Automatique de l'Organisation

As a **nouvel utilisateur ayant répondu aux questions**,
I want **que mon espace business soit créé automatiquement**,
So that **je puisse immédiatement commencer à utiliser le service**.

**Acceptance Criteria:**

**Given** les informations business sont collectées (nom, type)
**When** ZeroClaw appelle `POST /api/organizations` avec `{ name, type, phoneNumber }`
**Then** l'organisation est créée en base de données
**And** l'utilisateur reçoit un message de confirmation "🎉 Ton espace [nom] est prêt !"
**And** ZeroClaw suggère une première action : "Essaie : 'Dépense 5000 pour les boissons'"

### Story 1.4 : [ADAPTER] API Backend — Endpoint Organisation

As a **ZeroClaw agent**,
I want **un endpoint REST pour vérifier et créer des organisations**,
So that **je puisse automatiser l'onboarding**.

> **Code existant** : `OrganizationController` (`src/organization/application/controllers/organization.controller.ts`) — a `POST /organizations` via `CreateOrganizationUseCase`.
> **Travail** : Ajouter `GET /organizations?phoneNumber=` pour le lookup ZeroClaw. Le `POST` existe déjà.

**Acceptance Criteria:**

**Given** l'API REST SikaFlow
**When** `GET /organizations?phoneNumber=+225...` est appelé
**Then** retourne `[]` si aucune org, ou `[{ id, name, type, role }]` (avec le rôle de l'utilisateur dans chaque org)

**Given** un body valide `{ name, type, phoneNumber }`
**When** `POST /organizations` est appelé (EXISTANT)
**Then** crée l'organisation et retourne `{ id, name, type, createdAt }`
**And** associe le phoneNumber comme owner

### Story 1.5 : Sélection d'Organisation Multi-org

As a **utilisateur membre de plusieurs organisations**,
I want **que ZeroClaw identifie automatiquement sur quelle organisation je travaille**,
So that **mes actions soient exécutées dans le bon contexte sans confusion**.

**Acceptance Criteria:**

**Given** un utilisateur appartenant à 1 seule organisation
**When** il envoie un message
**Then** ZeroClaw utilise automatiquement cette organisation comme contexte
**And** aucune question n'est posée

**Given** un utilisateur appartenant à plusieurs organisations
**When** il envoie son premier message de la session
**Then** ZeroClaw vérifie la mémoire conversationnelle pour la dernière org active
**And** si trouvée, utilise cette org par défaut : "Je suis sur _Maquis Chez Omar_. Pour changer : 'Passe sur [autre org]'"

**Given** un utilisateur multi-org sans historique clair
**When** ZeroClaw ne peut pas déterminer l'organisation
**Then** il demande : "Tu es sur quelle organisation ? 1️⃣ Maquis Chez Omar (Owner) 2️⃣ Festival Abidjan (Manager)"
**And** mémorise le choix pour les messages suivants

**Given** un utilisateur qui dit "Passe sur Festival Abidjan"
**When** ZeroClaw reçoit ce message
**Then** il change le contexte actif vers cette organisation
**And** confirme : "✅ Tu es maintenant sur _Festival Abidjan_"

### Story 1.6 : [EXISTANT] Gestion des Membres d'Équipe

As a **Owner ou Manager d'une organisation**,
I want **ajouter ou supprimer des membres de mon équipe par message**,
So that **je gère mon équipe sans quitter WhatsApp/Telegram**.

> **Code existant** : `AddMemberUseCase` et `RemoveMemberUseCase` (`src/organization/application/use-cases/`), `OrganizationController` a `POST /:id/members` et `DELETE /:id/members/:userId`. RBAC vérifié côté backend (Owner peut tout, Manager peut ajouter/supprimer Staff uniquement).
> **Travail** : Câblage ZeroClaw uniquement (system prompt + tools HTTP). Le backend gère déjà toutes les règles RBAC.

**Acceptance Criteria:**

**Given** un Owner qui dit "Ajoute Fatou comme staff" ou "Ajoute +2250102030405 comme manager"
**When** ZeroClaw extrait le nom/numéro et le rôle demandé
**Then** appelle `POST /organizations/{orgId}/members` avec `{ phoneNumber, role }` (EXISTANT)
**And** le backend vérifie les permissions (Owner peut ajouter Manager/Staff, Manager peut ajouter Staff uniquement)
**And** confirme : "✅ Fatou a été ajoutée comme Staff"

**Given** un Manager qui essaie d'ajouter un autre Manager
**When** le backend rejette (403 Forbidden)
**Then** ZeroClaw répond : "⚠️ Seul le propriétaire peut ajouter un Manager"

**Given** un Owner qui dit "Retire Bakary de l'équipe"
**When** ZeroClaw appelle `DELETE /organizations/{orgId}/members/{userId}` (EXISTANT)
**Then** le membre est supprimé
**And** confirme : "✅ Bakary a été retiré de l'équipe"

---

## Epic 2 : Gestion de Caisse

**Objectif** : L'utilisateur peut gérer sa trésorerie quotidienne par simple message : enregistrer dépenses/revenus, consulter son solde, et recevoir des résumés.

### Story 2.1 : Enregistrement de Dépense par Message

As a **gérant de maquis/restaurant**,
I want **enregistrer une dépense en envoyant un message texte naturel**,
So that **ma comptabilité soit à jour sans effort**.

**Acceptance Criteria:**

**Given** un message utilisateur "Dépense 5000 pour les boissons"
**When** ZeroClaw extrait via IA : `{ amount: 5000, type: "EXPENSE", description: "boissons" }`
**Then** l'agent demande confirmation : "J'enregistre une dépense de 5 000 FCFA pour les boissons. Correct ?"
**And** sur confirmation, appelle `POST /api/transactions`
**And** confirme : "✅ Dépense de 5 000 FCFA enregistrée"

### Story 2.2 : Enregistrement de Revenu par Message

As a **gérant**,
I want **enregistrer un revenu par message**,
So that **je suive mes entrées d'argent**.

**Acceptance Criteria:**

**Given** un message "Reçu 25000 vente de billets"
**When** ZeroClaw extrait `{ amount: 25000, type: "INCOME", description: "vente de billets" }`
**Then** demande confirmation puis appelle `POST /api/transactions`
**And** confirme l'enregistrement

### Story 2.3 : Consultation du Solde et des Dernières Transactions

As a **gérant**,
I want **demander l'état de ma caisse**,
So that **je sache où j'en suis financièrement**.

**Acceptance Criteria:**

**Given** un message "Ma caisse" ou "Mon solde"
**When** ZeroClaw appelle `GET /api/transactions?phoneNumber={phone}&summary=true`
**Then** l'agent répond avec un résumé formaté incluant revenus totaux, dépenses totales, solde net, et les dernières opérations

### Story 2.4 : Catégorisation Automatique par IA

As a **gérant**,
I want **que mes transactions soient automatiquement catégorisées**,
So that **je puisse voir mes dépenses par catégorie sans effort**.

**Acceptance Criteria:**

**Given** un message "Payé 15000 au DJ"
**When** ZeroClaw extrait la transaction via IA
**Then** une catégorie est suggérée automatiquement (ex: "Staff / Prestataires")
**And** l'utilisateur peut corriger la catégorie si nécessaire

### Story 2.5 : [ADAPTER] API Backend — Endpoints Transactions

As a **ZeroClaw agent**,
I want **des endpoints REST pour les transactions**,
So that **je puisse enregistrer et consulter les données financières**.

> **Code existant** : `TransactionController` (`src/transaction/application/controllers/transaction.controller.ts`) — a `POST /transactions` via `CreateTransactionUseCase`, protégé par `ApiKeyGuard`.
> **Travail** : Ajouter `GET /transactions` (listing) et `GET /transactions?summary=true` (résumé). Le `POST` existe déjà.

**Acceptance Criteria:**

**Given** `POST /transactions` avec `{ amount, type, description, category, phoneNumber }` (EXISTANT)
**Then** crée la transaction et retourne l'objet créé

**Given** `GET /transactions?phoneNumber={phone}&limit=10` (NOUVEAU)
**Then** retourne les N dernières transactions

**Given** `GET /transactions?phoneNumber={phone}&summary=true` (NOUVEAU)
**Then** retourne `{ totalIncome, totalExpenses, balance, recentTransactions[] }`

---

## Epic 3 : Recouvrement de Dettes

**Objectif** : L'utilisateur peut suivre qui lui doit de l'argent, enregistrer les dettes/crédits, marquer les remboursements, et relancer automatiquement les débiteurs.

### Story 3.1 : Enregistrement d'une Dette

As a **gérant**,
I want **enregistrer qu'une personne me doit de l'argent par message**,
So that **je n'oublie aucune dette**.

**Acceptance Criteria:**

**Given** un message "Omar me doit 10000"
**When** ZeroClaw extrait `{ debtorName: "Omar", amount: 10000, type: "DEBT" }`
**Then** demande confirmation : "J'enregistre une dette : Omar te doit 10 000 FCFA. Correct ?"
**And** sur confirmation, appelle `POST /api/debts`
**And** confirme : "✅ Dette enregistrée : Omar — 10 000 FCFA"

### Story 3.2 : Enregistrement d'un Crédit

As a **gérant**,
I want **enregistrer que je dois de l'argent à quelqu'un**,
So that **je suive aussi ce que je dois**.

**Acceptance Criteria:**

**Given** un message "Je dois 5000 à Fatou"
**When** ZeroClaw extrait `{ creditorName: "Fatou", amount: 5000, type: "CREDIT" }`
**Then** demande confirmation puis appelle `POST /api/debts` avec le bon type

### Story 3.3 : Liste des Dettes en Cours

As a **gérant**,
I want **voir la liste de toutes les dettes non réglées**,
So that **je sache qui me doit quoi**.

**Acceptance Criteria:**

**Given** un message "Mes dettes" ou "Qui me doit ?"
**When** ZeroClaw appelle `GET /api/debts?phoneNumber={phone}&status=pending`
**Then** retourne une liste formatée par débiteur avec montants et ancienneté

### Story 3.4 : Marquer une Dette comme Remboursée

As a **gérant**,
I want **marquer une dette comme payée**,
So that **ma liste soit toujours à jour**.

**Acceptance Criteria:**

**Given** un message "Omar m'a payé" ou "Omar a remboursé"
**When** ZeroClaw identifie le débiteur et appelle `PATCH /api/debts/{id}/settle`
**Then** la dette est marquée comme remboursée
**And** confirmation : "✅ Dette réglée : Omar — 10 000 FCFA"
**And** si le débiteur a plusieurs dettes, demander laquelle

### Story 3.5 : Relance Automatique d'un Débiteur

As a **gérant**,
I want **envoyer un rappel à un débiteur**,
So that **je récupère mon argent sans confrontation directe**.

**Acceptance Criteria:**

**Given** un message "Relance Omar" ou "Rappelle à Omar sa dette"
**When** ZeroClaw appelle `POST /api/debts/{id}/remind`
**Then** le backend envoie un message WhatsApp/Telegram au débiteur (si son numéro est connu)
**And** le message est poli et professionnel : "Bonjour Omar, petit rappel concernant les 10 000 FCFA pour [description]. Merci ! — Envoyé via SikaFlow"
**And** confirmation au gérant : "✅ Rappel envoyé à Omar"

### Story 3.6 : [NOUVEAU] API Backend — Endpoints Dettes

As a **ZeroClaw agent**,
I want **des endpoints REST pour la gestion des dettes**,
So that **je puisse enregistrer, consulter et gérer les dettes**.

> **Code existant** : `DebtHandler` (`src/webhook/application/handlers/debt.handler.ts`) contient toute la logique métier (ADD_DEBT, SETTLE_DEBT, LIST_DEBTS, SEND_REMINDER, ADD_CREDIT, LIST_CREDITS). Les use-cases et repositories existent.
> **Travail** : Créer un nouveau `DebtController` dans `src/debt/infrastructure/web/` qui expose ces use-cases en REST. **Ne pas recréer la logique, juste câbler les controllers aux use-cases existants.**

**Acceptance Criteria:**

**Given** `POST /debts` avec `{ debtorName, amount, type, description, phoneNumber }` (NOUVEAU controller, use-case existant)
**Then** crée la dette et retourne l'objet créé

**Given** `GET /debts?phoneNumber={phone}&status=pending` (NOUVEAU)
**Then** retourne les dettes non réglées avec totaux

**Given** `PATCH /debts/{id}/settle` (NOUVEAU controller, logique existante dans DebtHandler)
**Then** marque la dette comme réglée

**Given** `POST /debts/{id}/remind` (NOUVEAU controller, logique existante dans DebtHandler)
**Then** envoie un message de rappel au débiteur
