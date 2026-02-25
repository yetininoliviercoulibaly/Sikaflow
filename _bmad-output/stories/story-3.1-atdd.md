# Architecture ATDD — Story 3.1

## Couche Testée : Use Case

### `AddDebtUseCase`

| # | Test | Préparation | Action | Assertion |
|---|------|-------------|--------|-----------|
| 1 | Enregistrement avec contact nouveau | `userRepository.findByPhoneNumber` → user, `resolveContext` → org, `contactService.addDebt` → Contact({ totalOwed: 5000 }) | `execute({ phoneNumber, amount: 5000, contactName: 'Kofi' })` | `result.totalOwed === 5000`, `contactService.addDebt` appelé avec `userId`, `organizationId`, `{ amount: 5000, contactName: 'Kofi' }` |
| 2 | Enregistrement avec contact existant (totalOwed accumulé) | `contactService.addDebt` → Contact({ totalOwed: 10000 }) | `execute({ phoneNumber, amount: 5000, contactName: 'Kofi' })` | `result.totalOwed === 10000` (total cumulé, géré par ContactService) |
| 3 | NotFoundException si user inconnu | `userRepository.findByPhoneNumber` → null | `execute({ phoneNumber: 'inconnu', amount: 5000, contactName: 'Kofi' })` | `rejects.toThrow(NotFoundException)` |
| 4 | Propagation erreur si montant invalide | `contactService.addDebt` → `throw new Error('Invalid amount')` | `execute({ phoneNumber, amount: -100, contactName: 'Kofi' })` | `rejects.toThrow('Invalid amount')` |

## Couche Testée : Controller (manuel / e2e — hors scope MVP)

| Endpoint | Input | Statut attendu |
|---|---|---|
| `POST /debts` | Body valide | 201 + Contact |
| `POST /debts` | `phoneNumber` inconnu | 404 |
| `POST /debts` | `amount` manquant | 400 |
| `POST /debts` | `contactName` manquant | 400 |

## Critères de Qualité

- 4 tests unitaires `AddDebtUseCase` — tous verts
- `contactService.addDebt` appelé avec les bons arguments (`userId`, `organizationId`, data)
- `NotFoundException` pour user inconnu
- Propagation transparente des erreurs `ContactService` (montant invalide)
