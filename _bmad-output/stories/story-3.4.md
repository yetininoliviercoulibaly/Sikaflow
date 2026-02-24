# Story 3.4: Relance d'un Débiteur

Status: done

## Story

As a **ZeroClaw agent**,
I want **pouvoir envoyer un rappel de paiement à un débiteur**,
So that **l'utilisateur peut relancer un contact qui tarde à rembourser, sans quitter la conversation WhatsApp**.

## Contexte

La logique de relance existe déjà dans `DebtHandler.handleSendReminder()` (webhook) et `SendReminderTool` (agent).
Story 3.4 expose cette logique via REST pour ZeroClaw.

Delta pour 3.4 :

| Composant | Statut avant 3.4 | Travail 3.4 |
|---|---|---|
| `DebtHandler.handleSendReminder()` | ✅ Existant (webhook) | Extraire logique dans use case |
| `SendDebtReminderUseCase` | ❌ Manquant | Créer wrapper |
| `POST /debts/:shortId/remind` | ❌ Manquant | Ajouter dans `DebtController` |
| `remind-debt.tool.yaml` | ❌ Manquant | Créer tool ZeroClaw |
| system-prompt.md — section Relance | ❌ Manquant | Ajouter flux |

## Acceptance Criteria

1. **Given** `POST /debts/:shortId/remind` avec `{ phoneNumber }` et un contact ayant un numéro de téléphone,
   **When** appelé,
   **Then** envoie un message WhatsApp au débiteur via `IMessagingService`
   **And** retourne `{ contact, messageSent: true, reminderText }`

2. **Given** un contact sans numéro de téléphone,
   **When** appelé,
   **Then** ne pas envoyer de message
   **And** retourne `{ contact, messageSent: false, reminderText }` (texte à envoyer manuellement)

3. **Given** un `shortId` inconnu ou contact sans créance (`totalOwed <= 0`),
   **When** appelé,
   **Then** retourne `404 Not Found`

4. **Given** `phoneNumber` inconnu,
   **When** appelé,
   **Then** retourne `404 Not Found`

5. **Given** un message de relance ("relance Kofi", "envoie un rappel à Bakary"),
   **When** ZeroClaw le détecte,
   **Then** appelle `remind_debt` et confirme :
   - Envoyé → "✅ Rappel envoyé à Kofi (+22508000000)"
   - Pas de numéro → "Kofi n'a pas de numéro enregistré. Voici un message à lui envoyer : [texte]"

## Tasks / Subtasks

- [ ] Task 1 : Créer `SendDebtReminderUseCase` (AC: #1, #2, #3, #4)
  - [ ] Subtask 1.1 : `SendDebtReminderCommand { phoneNumber, shortId }`
  - [ ] Subtask 1.2 : Résoudre user depuis `phoneNumber`
  - [ ] Subtask 1.3 : Trouver contact par shortId — NotFoundException si absent ou totalOwed <= 0
  - [ ] Subtask 1.4 : Si `contact.phone` → envoyer via `IMessagingService` → `messageSent: true`
  - [ ] Subtask 1.5 : Si pas de phone → `messageSent: false`
  - [ ] Subtask 1.6 : Retourner `{ contact, messageSent, reminderText }`

- [ ] Task 2 : Ajouter `POST /debts/:shortId/remind` dans `DebtController` (AC: #1, #2)
  - [ ] Subtask 2.1 : `@Post(':shortId/remind')` avec `RemindDebtDto { phoneNumber }`

- [ ] Task 3 : Tests unitaires `SendDebtReminderUseCase` (AC: #1, #2, #3, #4)
  - [ ] Subtask 3.1 : Envoi avec contact ayant un numéro
  - [ ] Subtask 3.2 : Pas d'envoi si contact sans numéro (`messageSent: false`)
  - [ ] Subtask 3.3 : NotFoundException si contact non trouvé
  - [ ] Subtask 3.4 : NotFoundException si contact totalOwed <= 0
  - [ ] Subtask 3.5 : NotFoundException si user inconnu

- [ ] Task 4 : Enregistrer dans `ContactModule`

- [ ] Task 5 : Créer `zeroclaw/tools/remind-debt.tool.yaml` (AC: #5)

- [ ] Task 6 : Mettre à jour `zeroclaw/system-prompt.md` (AC: #5)

## Dev Notes

### Endpoint cible

```
POST /debts/:shortId/remind
Body: { "phoneNumber": "+22507000000" }
Response: {
  "contact": { id, shortId, displayName, totalOwed, phone? },
  "messageSent": true,
  "reminderText": "👋 Bonjour Kofi, ..."
}
```

### Message de relance (identique au webhook existant)

```
👋 Bonjour [displayName], ceci est un rappel de votre contact concernant une dette de [totalOwed] FCFA. Merci de régulariser dès que possible ! 🙏
```

### Résolution du contact

Contrairement aux autres use cases, `SendDebtReminderUseCase` injecte directement `IContactRepository` (besoin de `findByShortId`) en plus de `IMessagingService`.

`ResolveContextUseCase` non nécessaire — le userId seul suffit pour trouver le contact.

### References

- [Source: backend/src/webhook/application/handlers/debt.handler.ts:316-393 — logique existante]
- [Source: backend/src/contact/application/use-cases/settle-debt.use-case.ts — pattern]
- [Source: backend/src/common/messaging/messaging.service.interface.ts — IMessagingService]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- `ResolveContextUseCase` non nécessaire — `findByShortId(userId, shortId)` suffit pour identifier le contact
- `reminderText` toujours retourné même si messageSent=false — permet copier-coller dans WhatsApp
- `MessagingModule` déjà importé dans `ContactModule` depuis Story 3.1 — aucune modification nécessaire
- NotFoundException si `totalOwed <= 0` — évite les rappels inutiles (contact remboursé entre temps)
- Epic 3 complet : 4/4 endpoints dettes opérationnels

### File List

- `backend/src/contact/application/use-cases/send-debt-reminder.use-case.ts` (créé)
- `backend/src/contact/application/use-cases/send-debt-reminder.use-case.spec.ts` (créé)
- `backend/src/contact/application/controllers/debt.controller.ts` (modifié)
- `backend/src/contact/contact.module.ts` (modifié)
- `zeroclaw/tools/remind-debt.tool.yaml` (créé)
- `zeroclaw/system-prompt.md` (modifié)
- `_bmad-output/stories/story-3.4.md` (créé)
- `_bmad-output/stories/story-3.4-atdd.md` (créé)
- `_bmad-output/stories/story-3.4-trace.md` (créé)

