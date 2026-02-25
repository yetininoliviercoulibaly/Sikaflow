# Matrice de Traçabilité — Story 3.4

## Coverage AC Story 3.4

| AC | Statut avant 3.4 | Statut après 3.4 | Artefact |
|----|-----------------|-----------------|---------|
| AC#1 — Envoi WhatsApp si contact a un numéro | ❌ | ✅ | `SendDebtReminderUseCase` + `IMessagingService.sendMessage` |
| AC#2 — `messageSent: false` si pas de numéro | ❌ | ✅ | `SendDebtReminderUseCase` — branche `if (!contact.phone)` |
| AC#3 — 404 si shortId inconnu ou totalOwed <= 0 | ❌ | ✅ | `SendDebtReminderUseCase` — NotFoundException x2 |
| AC#4 — 404 si phoneNumber inconnu | ❌ | ✅ | `SendDebtReminderUseCase` — user check |
| AC#5 — ZeroClaw confirme envoi ou fournit texte | ❌ | ✅ | `system-prompt.md` + `remind-debt.tool.yaml` |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/contact/application/use-cases/send-debt-reminder.use-case.ts` | Créé | Envoi rappel via `IMessagingService`, fallback si pas de numéro |
| `backend/src/contact/application/use-cases/send-debt-reminder.use-case.spec.ts` | Créé | 5 tests unitaires |
| `backend/src/contact/application/controllers/debt.controller.ts` | Modifié | Ajout `POST /:shortId/remind` |
| `backend/src/contact/contact.module.ts` | Modifié | `SendDebtReminderUseCase` enregistré |
| `zeroclaw/tools/remind-debt.tool.yaml` | Créé | Tool ZeroClaw `POST /debts/:shortId/remind` |
| `zeroclaw/system-prompt.md` | Modifié | Section "Relance d'un Débiteur" |

## Couverture Endpoints — État Final Epic 3

| Endpoint | Implémenté dans | Statut |
|---|---|---|
| `POST /debts` | Story 3.1 | ✅ |
| `GET /debts` | Story 3.2 | ✅ |
| `PATCH /debts/:shortId/settle` | Story 3.3 | ✅ |
| `POST /debts/:shortId/remind` | Story 3.4 | ✅ |

## Dépendances

- **Dépend de** : Story 3.3 (`DebtController` + `ContactModule` configurés), `MessagingModule` (déjà importé)
- **Réutilise** : `IContactRepository.findByShortId()` (pré-existant), `IMessagingService` (pré-existant)
- **Clôture** : Epic 3 — tous les endpoints dettes sont complets et opérationnels
