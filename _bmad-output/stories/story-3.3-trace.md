# Matrice de Traçabilité — Story 3.3

## Coverage AC Story 3.3

| AC | Statut avant 3.3 | Statut après 3.3 | Artefact |
|----|-----------------|-----------------|---------|
| AC#1 — `PATCH /debts/:shortId/settle` → réduit totalOwed + audit INCOME | ❌ | ✅ | `SettleDebtUseCase` + `DebtController.PATCH` |
| AC#2 — Sans `amount` → règlement total | ❌ | ✅ | `ContactService.settleDebt()` cap automatique (pré-existant) |
| AC#3 — `amount > totalOwed` → cap automatique | ❌ | ✅ | `ContactService.settleDebt()` (pré-existant) |
| AC#4 — shortId inconnu → 404 | ❌ | ✅ | `SettleDebtUseCase` null-check + NotFoundException |
| AC#5 — phoneNumber inconnu → 404 | ❌ | ✅ | `SettleDebtUseCase` user check |
| AC#6 — ZeroClaw confirme règlement total/partiel | ❌ | ✅ | `system-prompt.md` + `settle-debt.tool.yaml` |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/contact/application/use-cases/settle-debt.use-case.ts` | Créé | Wrapper mince — résout contexte, délègue à `ContactService.settleDebt()` |
| `backend/src/contact/application/use-cases/settle-debt.use-case.spec.ts` | Créé | 4 tests unitaires |
| `backend/src/contact/application/controllers/debt.controller.ts` | Modifié | Ajout `PATCH /:shortId/settle` |
| `backend/src/contact/contact.module.ts` | Modifié | `SettleDebtUseCase` enregistré |
| `zeroclaw/tools/settle-debt.tool.yaml` | Créé | Tool ZeroClaw `PATCH /debts/:shortId/settle` |
| `zeroclaw/system-prompt.md` | Modifié | Section "Règlement d'une Créance" |

## Couverture Endpoints — État Final Epic 3 (partiel)

| Endpoint | Implémenté dans | Statut |
|---|---|---|
| `POST /debts` | Story 3.1 | ✅ |
| `GET /debts` | Story 3.2 | ✅ |
| `PATCH /debts/:shortId/settle` | Story 3.3 | ✅ |
| `POST /debts/:id/remind` | Story 3.4 (planifié) | ❌ |

## Dépendances

- **Dépend de** : Story 3.2 (`DebtController` + `ContactModule` configurés)
- **Réutilise** : `ContactService.settleDebt()` (pré-existant) — cap automatique, audit INCOME
- **Ouvre** : Story 3.4 (relance débiteur)
