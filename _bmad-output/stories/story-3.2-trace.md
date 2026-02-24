# Matrice de Traçabilité — Story 3.2

## Coverage AC Story 3.2

| AC | Statut avant 3.2 | Statut après 3.2 | Artefact |
|----|-----------------|-----------------|---------|
| AC#1 — `GET /debts` → Contact[] (totalOwed > 0) | ❌ | ✅ | `GetDebtsListUseCase` + `DebtController.GET` |
| AC#2 — Liste vide → `[]` | ❌ | ✅ | `GetDebtsListUseCase` — pass-through repository |
| AC#3 — `404` si phoneNumber inconnu | ❌ | ✅ | `GetDebtsListUseCase` NotFoundException |
| AC#4 — ZeroClaw formate la liste | ❌ | ✅ | `system-prompt.md` section consultation + `get-debts.tool.yaml` |
| AC#5 — Liste vide → message dédié | ❌ | ✅ | `system-prompt.md` formatage liste vide |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/contact/application/use-cases/get-debts-list.use-case.ts` | Créé | Liste créances via `findWithPendingDebts` |
| `backend/src/contact/application/use-cases/get-debts-list.use-case.spec.ts` | Créé | 3 tests unitaires |
| `backend/src/contact/application/controllers/debt.controller.ts` | Modifié | Ajout `GET /debts` |
| `backend/src/contact/contact.module.ts` | Modifié | `GetDebtsListUseCase` enregistré |
| `zeroclaw/tools/get-debts.tool.yaml` | Créé | Tool ZeroClaw `GET /debts` |
| `zeroclaw/system-prompt.md` | Modifié | Section "Consultation de la Liste des Dettes" |

## Couverture Endpoints — État Final Epic 3 (partiel)

| Endpoint | Implémenté dans | Statut |
|---|---|---|
| `POST /debts` | Story 3.1 | ✅ |
| `GET /debts` | Story 3.2 | ✅ |
| `PATCH /debts/:id/settle` | Story 3.3 (planifié) | ❌ |
| `POST /debts/:id/remind` | Story 3.4 (planifié) | ❌ |

## Dépendances

- **Dépend de** : Story 3.1 (`DebtController` existant, `ContactModule` configuré)
- **Réutilise** : `IContactRepository.findWithPendingDebts()` (pré-existant)
- **Ouvre** : Stories 3.3 (règlement dette), 3.4 (relance débiteur)
