# Architecture ATDD — Story 3.2

## Couche Testée : Use Case

### `GetDebtsListUseCase`

| # | Test | Préparation | Action | Assertion |
|---|------|-------------|--------|-----------|
| 1 | Liste avec plusieurs créances | `findWithPendingDebts` → [Contact A (5000), Contact B (25000)] | `execute({ phoneNumber })` | `result.length === 2`, `contactRepository.findWithPendingDebts` appelé avec `userId`, `orgId` |
| 2 | Liste vide — aucune créance | `findWithPendingDebts` → [] | `execute({ phoneNumber })` | `result` est `[]` |
| 3 | NotFoundException si user inconnu | `userRepository.findByPhoneNumber` → null | `execute({ phoneNumber: 'inconnu' })` | `rejects.toThrow(NotFoundException)` |

## Couche Testée : Controller (manuel / e2e — hors scope)

| Endpoint | Input | Statut attendu |
|---|---|---|
| `GET /debts?phoneNumber=+225...` | phoneNumber connu | 200 + Contact[] |
| `GET /debts` | sans phoneNumber | 400 |
| `GET /debts?phoneNumber=inconnu` | user inexistant | 404 |

## Critères de Qualité

- 3 tests unitaires `GetDebtsListUseCase` — tous verts
- `contactRepository.findWithPendingDebts` appelé avec `userId` et `orgId`
- NotFoundException pour user inconnu
- Tableau vide retourné sans erreur si aucune créance
