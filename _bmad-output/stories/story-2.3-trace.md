# Matrice de Traçabilité — Story 2.3

## Coverage par rapport aux stories précédentes

| Prérequis | Couvert par | Statut |
|----|-------------|--------|
| `ResolveContextUseCase` disponible | Backend pré-existant | ✅ |
| `findByOrganization` sur repository | Backend pré-existant | ✅ |
| `ApiKeyGuard` sur TransactionController | Backend pré-existant | ✅ |
| INCOME/EXPENSE enregistrables | Stories 2.1, 2.2 | ✅ |
| `session.activeOrgName` en mémoire ZeroClaw | Stories 1.3–1.4 | ✅ |

## Couverture AC Story 2.3

| AC | Statut | Artefact |
|----|--------|---------|
| AC#1 — GET summary → résumé formaté WhatsApp | ✅ | `get-balance.tool.yaml` + `system-prompt.md` |
| AC#2 — Caisse vide → message encouragement | ✅ | `system-prompt.md` — cas balance=0 |
| AC#3 — Backend GET retourne totalIncome/Expenses/balance/recent | ✅ | `GetTransactionsSummaryUseCase` |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/transaction/application/use-cases/get-transactions-summary.use-case.ts` | Créé | Use case calcul résumé caisse |
| `backend/src/transaction/application/use-cases/get-transactions-summary.use-case.spec.ts` | Créé | 5 tests unitaires |
| `backend/src/transaction/application/controllers/transaction.controller.ts` | Modifié | GET /transactions ajouté |
| `backend/src/transaction/transaction.module.ts` | Modifié | GetTransactionsSummaryUseCase enregistré |
| `zeroclaw/tools/get-balance.tool.yaml` | Créé | Tool GET /transactions?summary=true |
| `zeroclaw/system-prompt.md` | Modifié | Section Consultation Solde + formatage |

## Dépendances

- **Dépend de** : Stories 2.1 (EXPENSE), 2.2 (INCOME), `ResolveContextUseCase` (pré-existant)
- **Anticipe** : Story 2.5 [ADAPTER] — l'endpoint GET /transactions créé ici couvre partiellement 2.5
- **Prépare** : Story 2.4 (catégorisation — lit les mêmes transactions)
- **Filtre** : INCOME + EXPENSE uniquement (DEBT/CREDIT = Epic 3)
