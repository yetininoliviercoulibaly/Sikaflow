# Architecture ATDD — Story 3.3

## Couche Testée : Use Case

### `SettleDebtUseCase`

| # | Test | Préparation | Action | Assertion |
|---|------|-------------|--------|-----------|
| 1 | Règlement total (sans amount) | `contactService.settleDebt` → `{ contact, settledAmount: 5000, remaining: 0 }` | `execute({ phoneNumber, shortId: 'BC12AB' })` | `result.remaining === 0`, `contactService.settleDebt` appelé avec `userId, orgId, { contactShortId: 'BC12AB', amount: undefined }` |
| 2 | Règlement partiel (avec amount) | `contactService.settleDebt` → `{ contact, settledAmount: 3000, remaining: 2000 }` | `execute({ phoneNumber, shortId: 'BC12AB', amount: 3000 })` | `result.settledAmount === 3000`, `result.remaining === 2000` |
| 3 | NotFoundException si contact non trouvé | `contactService.settleDebt` → `null` | `execute({ phoneNumber, shortId: 'XXXXXX' })` | `rejects.toThrow(NotFoundException)` |
| 4 | NotFoundException si user inconnu | `userRepository.findByPhoneNumber` → `null` | `execute({ phoneNumber: 'inconnu', shortId: 'BC12AB' })` | `rejects.toThrow(NotFoundException)` |

## Couche Testée : Controller (manuel / e2e — hors scope)

| Endpoint | Input | Statut attendu |
|---|---|---|
| `PATCH /debts/BC12AB/settle` | phoneNumber connu, shortId valide | 200 + `{ contact, settledAmount, remaining }` |
| `PATCH /debts/XXXXXX/settle` | shortId inconnu | 404 |
| `PATCH /debts/BC12AB/settle` | phoneNumber inconnu | 404 |

## Critères de Qualité

- 4 tests unitaires `SettleDebtUseCase` — tous verts
- `contactService.settleDebt` appelé avec `userId`, `orgId`, `{ contactShortId }`
- NotFoundException si `settleDebt` retourne null (contact non trouvé)
- NotFoundException si user inconnu
