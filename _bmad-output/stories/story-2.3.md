# Story 2.3: Consultation du Solde et des Dernières Transactions

Status: dev

## Story

As a **gérant**,
I want **demander l'état de ma caisse par message**,
So that **je sache où j'en suis financièrement à tout moment**.

## Contexte

ZeroClaw doit appeler `GET /transactions?phoneNumber={phone}&summary=true` pour récupérer le résumé.
Cet endpoint n'existe pas encore — il est prévu en Story 2.5 [ADAPTER].
Il est implémenté ici car il est bloquant pour cette story.

Le repository `findByOrganization` existe déjà. Le travail backend consiste à :
1. Créer `GetTransactionsSummaryUseCase` (calcul totalIncome, totalExpenses, balance, recent)
2. Ajouter `GET /transactions` au `TransactionController`

Côté ZeroClaw : tool YAML + section system-prompt.

## Acceptance Criteria

1. **Given** un message "Ma caisse" ou "Mon solde" ou "Où j'en suis",
   **When** ZeroClaw appelle `GET /transactions?phoneNumber={phone}&summary=true`,
   **Then** reçoit `{ totalIncome, totalExpenses, balance, recentTransactions[] }`
   **And** répond avec un résumé formaté :
   ```
   💰 Ta caisse — Maquis Chez Omar
   Revenus    : 75 000 FCFA
   Dépenses   : 32 000 FCFA
   ─────────────────────
   Solde net  : 43 000 FCFA

   Dernières opérations :
   ✅ +25 000 — vente de billets
   🔴 -5 000 — boissons
   🔴 -2 000 — transport
   ```

2. **Given** aucune transaction enregistrée,
   **When** ZeroClaw appelle le résumé,
   **Then** répond : "Ta caisse est vide pour l'instant. Enregistre ta première dépense ou ton premier revenu !"

3. **Given** `GET /transactions?phoneNumber={phone}&summary=true` (backend),
   **When** appelé avec une API Key valide,
   **Then** retourne `{ totalIncome, totalExpenses, balance, recentTransactions[] }`
   **And** filtre uniquement les types INCOME et EXPENSE (pas les DEBT/CREDIT)

## Tasks / Subtasks

- [x] Task 1 : Créer `GetTransactionsSummaryUseCase` (AC: #3)
  - [x] Subtask 1.1 : Interface `TransactionsSummary`
  - [x] Subtask 1.2 : Résoudre contexte org via `ResolveContextUseCase`
  - [x] Subtask 1.3 : `findByOrganization` + calcul totaux (INCOME/EXPENSE uniquement)
  - [x] Subtask 1.4 : Retourner les 5 dernières transactions dans `recentTransactions`

- [x] Task 2 : Ajouter GET /transactions au controller (AC: #3)
  - [x] Subtask 2.1 : `@Get()` avec `?phoneNumber` + `?summary=true`
  - [x] Subtask 2.2 : Enregistrer use case dans module

- [x] Task 3 : Tests unitaires `GetTransactionsSummaryUseCase` (AC: #2, #3)
  - [x] Subtask 3.1 : Test résumé avec transactions INCOME + EXPENSE
  - [x] Subtask 3.2 : Test caisse vide → balance=0, listes vides
  - [x] Subtask 3.3 : Test filtrage DEBT/CREDIT exclus des totaux

- [x] Task 4 : Créer `get-balance.tool.yaml` (AC: #1)
- [x] Task 5 : Mettre à jour `system-prompt.md` — section Consultation Solde (AC: #1, #2)

## Dev Notes

### Calcul du Résumé

```typescript
const income = txs.filter(t => t.type === TransactionType.INCOME);
const expenses = txs.filter(t => t.type === TransactionType.EXPENSE);
const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
const balance = totalIncome - totalExpenses;
```

### Endpoint

```
GET /transactions?phoneNumber=+225...&summary=true
Headers: X-API-Key: {key}
Response: {
  totalIncome: number,
  totalExpenses: number,
  balance: number,
  recentTransactions: [{ id, type, amount, category, description, transactionDate }]
}
```

### References

- [Source: backend/src/transaction/infrastructure/persistence/mikro-orm-transaction.repository.ts:20-38]
- [Source: backend/src/transaction/domain/ports/transaction.repository.interface.ts]
- [Source: backend/src/transaction/application/use-cases/get-last-transaction.use-case.ts — pattern]
- [Source: backend/src/organization/application/use-cases/resolve-context.use-case.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Backend : `GetTransactionsSummaryUseCase` + GET /transactions endpoint (anticipe Story 2.5)
- Filtre INCOME/EXPENSE uniquement — DEBT/CREDIT gérés séparément (Epic 3)
- `recentTransactions` limité aux 5 dernières pour concision WhatsApp
- ZeroClaw formate le résumé en message visuel avec emojis

### File List

- `backend/src/transaction/application/use-cases/get-transactions-summary.use-case.ts` (créé)
- `backend/src/transaction/application/use-cases/get-transactions-summary.use-case.spec.ts` (créé)
- `backend/src/transaction/application/controllers/transaction.controller.ts` (modifié — GET ajouté)
- `backend/src/transaction/transaction.module.ts` (modifié — use case enregistré)
- `zeroclaw/tools/get-balance.tool.yaml` (créé)
- `zeroclaw/system-prompt.md` (modifié — section Consultation Solde)
- `_bmad-output/stories/story-2.3.md` (créé)
- `_bmad-output/stories/story-2.3-atdd.md` (créé)
- `_bmad-output/stories/story-2.3-trace.md` (créé)
