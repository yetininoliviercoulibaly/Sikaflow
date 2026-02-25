# Matrice de Traçabilité — Story 2.5

## Coverage AC Story 2.5

| AC | Statut avant 2.5 | Statut après 2.5 | Artefact |
|----|-----------------|-----------------|---------|
| AC#1 — `GET ?summary=true` → `TransactionsSummary` | ⚠️ Story 2.3 (param ignoré) | ✅ | Controller GET discriminé |
| AC#2 — `GET ?limit=N` → `Transaction[]` | ❌ | ✅ | `GetTransactionsListUseCase` |
| AC#3 — Sans params → liste défaut limit=10 | ❌ | ✅ | Controller — fallback `limit=10` |
| AC#4 — `POST /transactions` inchangé | ✅ | ✅ | Inchangé |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/transaction/application/use-cases/get-transactions-list.use-case.ts` | Créé | Liste brute N transactions |
| `backend/src/transaction/application/use-cases/get-transactions-list.use-case.spec.ts` | Créé | 4 tests unitaires |
| `backend/src/transaction/application/controllers/transaction.controller.ts` | Modifié | Discrimination `?summary=true` vs `?limit=N` + NaN guard |
| `backend/src/transaction/transaction.module.ts` | Modifié | `GetTransactionsListUseCase` enregistré |

## Couverture Endpoints — État Final Epic 2

| Endpoint | Implémenté dans | Statut |
|---|---|---|
| `POST /transactions` | Pré-existant | ✅ |
| `GET ?summary=true` | Story 2.3 + fix 2.5 | ✅ |
| `GET ?limit=N` | Story 2.5 | ✅ |
| `PATCH /:id/category` | Story 2.4 | ✅ |

## Dépendances

- **Dépend de** : Stories 2.3 (`GetTransactionsSummaryUseCase`), 2.4 (architecture)
- **Clôture** : Epic 2 — tous les endpoints transactions sont complets et opérationnels
