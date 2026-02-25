# Matrice de Traçabilité — Story 2.4

## Coverage par rapport aux stories précédentes

| Prérequis | Couvert par | Statut |
|----|-------------|--------|
| `record_expense` enregistre et retourne `{ id, category }` | Story 2.1 | ✅ |
| `record_income` enregistre et retourne `{ id, category }` | Story 2.2 | ✅ |
| `findById` sur ITransactionRepository | Pré-existant | ✅ |
| `ApiKeyGuard` sur TransactionController | Pré-existant | ✅ |

## Couverture AC Story 2.4

| AC | Statut | Artefact |
|----|--------|---------|
| AC#1 — Catégorie visible dans la confirmation | ✅ | `system-prompt.md` — "Confirmation avec catégorie visible" |
| AC#1 — `session.lastTransactionId` mémorisé | ✅ | `post_actions` dans `record-expense.tool.yaml` + `record-income.tool.yaml` |
| AC#2 — Correction via PATCH après enregistrement | ✅ | `update-transaction-category.tool.yaml` + `system-prompt.md` — flux correction |
| AC#3 — PATCH /transactions/:id/category backend | ✅ | `UpdateTransactionCategoryUseCase` + controller |
| AC#4 — Pas de `lastTransactionId` → message explicatif | ✅ | `system-prompt.md` — fallback correction |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/transaction/domain/ports/transaction.repository.interface.ts` | Modifié | `update()` ajoutée |
| `backend/src/transaction/infrastructure/persistence/mikro-orm-transaction.repository.ts` | Modifié | Implémentation `update()` via `em.assign` + `em.flush` |
| `backend/src/transaction/application/use-cases/update-transaction-category.use-case.ts` | Créé | Use case correction catégorie |
| `backend/src/transaction/application/use-cases/update-transaction-category.use-case.spec.ts` | Créé | 3 tests unitaires |
| `backend/src/transaction/application/controllers/transaction.controller.ts` | Modifié | `PATCH :id/category` |
| `backend/src/transaction/transaction.module.ts` | Modifié | `UpdateTransactionCategoryUseCase` enregistré |
| `zeroclaw/tools/record-expense.tool.yaml` | Modifié | `post_actions` — mémorise `session.lastTransactionId` |
| `zeroclaw/tools/record-income.tool.yaml` | Modifié | `post_actions` — mémorise `session.lastTransactionId` |
| `zeroclaw/tools/update-transaction-category.tool.yaml` | Créé | PATCH /transactions/:id/category |
| `zeroclaw/system-prompt.md` | Modifié | Confirmation avec catégorie + section correction |

## Dépendances

- **Dépend de** : Stories 2.1 (record_expense), 2.2 (record_income)
- **Clôture** : Epic 2 côté ZeroClaw — tous les flux caisse de base sont couverts (2.1–2.4)
- **Note** : Story 2.5 [ADAPTER] partiellement couverte par 2.3 (GET) et 2.4 (PATCH)
