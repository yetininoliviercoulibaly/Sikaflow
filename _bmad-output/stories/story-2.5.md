# Story 2.5: [ADAPTER] API Backend — Endpoints Transactions

Status: dev

## Story

As a **ZeroClaw agent**,
I want **des endpoints REST complets pour les transactions**,
So that **je puisse enregistrer, lister et résumer les données financières**.

## Contexte

Stories 2.1–2.4 ont déjà implémenté la majorité des endpoints.
Delta pour 2.5 :

| Endpoint | Statut avant 2.5 | Travail 2.5 |
|---|---|---|
| `POST /transactions` | ✅ Existant | Aucun |
| `GET ?summary=true` → résumé | ✅ Story 2.3 (mais `?summary` ignoré) | Discriminer summary vs liste |
| `GET ?limit=N` → `Transaction[]` brut | ❌ Manquant | Créer `GetTransactionsListUseCase` |
| `PATCH /:id/category` | ✅ Story 2.4 | Aucun |

## Acceptance Criteria

1. **Given** `GET /transactions?phoneNumber={phone}&summary=true`,
   **When** appelé avec une API Key valide,
   **Then** retourne `{ totalIncome, totalExpenses, balance, recentTransactions[] }`
   **And** `?startDate` et `?endDate` optionnels sont supportés

2. **Given** `GET /transactions?phoneNumber={phone}&limit=10`,
   **When** appelé avec une API Key valide,
   **Then** retourne un tableau de transactions brutes (les N plus récentes)
   **And** `limit` par défaut est 10 si absent

3. **Given** `GET /transactions?phoneNumber={phone}` (sans `summary` ni `limit`),
   **When** appelé,
   **Then** se comporte comme `?limit=10` (mode liste par défaut)

4. **Given** `POST /transactions` avec `{ phoneNumber, amount, type, category, description }` (EXISTANT),
   **Then** crée la transaction et retourne l'objet créé (inchangé)

## Tasks / Subtasks

- [x] Task 1 : Créer `GetTransactionsListUseCase` (AC: #2, #3)
  - [x] Subtask 1.1 : `GetTransactionsListCommand { phoneNumber, limit? }`
  - [x] Subtask 1.2 : Résoudre contexte → `findByOrganization({ limit })`
  - [x] Subtask 1.3 : Retourne `Transaction[]`

- [x] Task 2 : Mettre à jour le controller GET (AC: #1, #2, #3)
  - [x] Subtask 2.1 : Si `?summary=true` → `getTransactionsSummaryUseCase`
  - [x] Subtask 2.2 : Sinon → `getTransactionsListUseCase` avec `?limit`

- [x] Task 3 : Tests unitaires `GetTransactionsListUseCase` (AC: #2, #3)
  - [x] Subtask 3.1 : Liste avec limit explicite
  - [x] Subtask 3.2 : Limit par défaut = 10
  - [x] Subtask 3.3 : NotFoundException si user inconnu

- [x] Task 4 : Enregistrer use case dans module

## Dev Notes

### Comportement GET discriminé

```
GET /transactions?phoneNumber=+225...&summary=true   → TransactionsSummary
GET /transactions?phoneNumber=+225...&limit=10       → Transaction[]
GET /transactions?phoneNumber=+225...                → Transaction[] (limit=10 par défaut)
```

### References

- [Source: backend/src/transaction/application/controllers/transaction.controller.ts]
- [Source: backend/src/transaction/application/use-cases/get-transactions-summary.use-case.ts — pattern]
- [Source: backend/src/transaction/infrastructure/persistence/mikro-orm-transaction.repository.ts:20-38]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Story backend pure — aucun changement ZeroClaw (get-balance.tool.yaml déjà correct)
- `get-balance.tool.yaml` envoie `?summary=true` → sera correctement routé après le fix
- Mode liste (défaut) utile pour futures stories (Epic 3 consultation dettes, etc.)

### File List

- `backend/src/transaction/application/use-cases/get-transactions-list.use-case.ts` (créé)
- `backend/src/transaction/application/use-cases/get-transactions-list.use-case.spec.ts` (créé)
- `backend/src/transaction/application/controllers/transaction.controller.ts` (modifié)
- `backend/src/transaction/transaction.module.ts` (modifié)
- `_bmad-output/stories/story-2.5.md` (créé)
- `_bmad-output/stories/story-2.5-atdd.md` (créé)
- `_bmad-output/stories/story-2.5-trace.md` (créé)
