# Architecture ATDD — Story 3.4

## Couche Testée : Use Case

### `SendDebtReminderUseCase`

| # | Test | Préparation | Action | Assertion |
|---|------|-------------|--------|-----------|
| 1 | Envoi si contact a un numéro | `findByShortId` → Contact({ phone: '+22508000000', totalOwed: 5000 }), `messagingService.sendMessage` → void | `execute({ phoneNumber, shortId: 'BC12AB' })` | `result.messageSent === true`, `messagingService.sendMessage` appelé avec `'+22508000000'` + texte contenant "Kofi" |
| 2 | Pas d'envoi si contact sans numéro | `findByShortId` → Contact({ phone: undefined, totalOwed: 5000 }) | `execute({ phoneNumber, shortId: 'BC12AB' })` | `result.messageSent === false`, `messagingService.sendMessage` NON appelé |
| 3 | NotFoundException si contact non trouvé | `findByShortId` → null | `execute({ phoneNumber, shortId: 'XXXXXX' })` | `rejects.toThrow(NotFoundException)` |
| 4 | NotFoundException si totalOwed <= 0 | `findByShortId` → Contact({ totalOwed: 0 }) | `execute({ phoneNumber, shortId: 'BC12AB' })` | `rejects.toThrow(NotFoundException)` |
| 5 | NotFoundException si user inconnu | `userRepository.findByPhoneNumber` → null | `execute({ phoneNumber: 'inconnu', shortId: 'BC12AB' })` | `rejects.toThrow(NotFoundException)` |

## Couche Testée : Controller (manuel / e2e — hors scope)

| Endpoint | Input | Statut attendu |
|---|---|---|
| `POST /debts/BC12AB/remind` | user + contact valides, contact a un téléphone | 201 + `{ messageSent: true }` |
| `POST /debts/BC12AB/remind` | contact sans téléphone | 201 + `{ messageSent: false }` |
| `POST /debts/XXXXXX/remind` | shortId inconnu | 404 |
| `POST /debts/BC12AB/remind` | phoneNumber inconnu | 404 |

## Critères de Qualité

- 5 tests unitaires `SendDebtReminderUseCase` — tous verts
- `messagingService.sendMessage` appelé uniquement si `contact.phone` défini
- NotFoundException si contact null, totalOwed <= 0, ou user inconnu
- `reminderText` toujours présent dans la réponse (pour copier-coller si pas de numéro)
