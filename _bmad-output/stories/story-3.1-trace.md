# Matrice de Traçabilité — Story 3.1

## Coverage AC Story 3.1

| AC | Statut avant 3.1 | Statut après 3.1 | Artefact |
|----|-----------------|-----------------|---------|
| AC#1 — `POST /debts` enregistre créance | ❌ | ✅ | `AddDebtUseCase` + `DebtController` |
| AC#2 — `404` si phoneNumber inconnu | ❌ | ✅ | `AddDebtUseCase` NotFoundException |
| AC#3 — `400` si amount invalide | ❌ | ✅ | `CreateDebtDto` @Min(1) + ValidationPipe |
| AC#4 — ZeroClaw demande infos manquantes | ❌ | ✅ | `system-prompt.md` — flux clarification |
| AC#5 — Confirmation + mémorisation session | ❌ | ✅ | `record-debt.tool.yaml` post_actions |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/contact/application/use-cases/add-debt.use-case.ts` | Créé | Wrapper mince autour de `ContactService.addDebt()` |
| `backend/src/contact/application/use-cases/add-debt.use-case.spec.ts` | Créé | 4 tests unitaires |
| `backend/src/contact/application/controllers/debt.controller.ts` | Créé | Endpoint `POST /debts` |
| `backend/src/contact/contact.module.ts` | Modifié | `AddDebtUseCase`, `DebtController`, `OrganizationModule` enregistrés |
| `zeroclaw/tools/record-debt.tool.yaml` | Créé | Tool ZeroClaw `POST /debts` |
| `zeroclaw/system-prompt.md` | Modifié | Section "Gestion des Dettes — Enregistrement d'une Créance" |

## Couverture Endpoints — État Final Epic 3 (partiel)

| Endpoint | Implémenté dans | Statut |
|---|---|---|
| `POST /debts` | Story 3.1 | ✅ |
| `GET /debts` | Story 3.2 (planifié) | ❌ |
| `PATCH /debts/:id/settle` | Story 3.3 (planifié) | ❌ |
| `POST /debts/:id/remind` | Story 3.4 (planifié) | ❌ |

## Dépendances

- **Dépend de** : Story 2.5 (architecture backend stable), `ContactService.addDebt()` (pré-existant)
- **Ouvre** : Stories 3.2 (liste dettes), 3.3 (règlement), 3.4 (relance)
