# ATDD — Story 2.5 : Endpoints Transactions (Adapter)

## Stratégie de Test

Story backend pure. Tests unitaires sur le nouveau use case + validation du routage GET.

| Couche | Approche |
|--------|----------|
| `GetTransactionsListUseCase` | Tests unitaires Jest |
| Routage `GET ?summary` vs `?limit` | Tests unitaires contrôleur (via use case mocks) |
| `POST /transactions` | Couvert par tests existants (inchangé) |
| `PATCH /:id/category` | Couvert par Story 2.4 (inchangé) |

---

## Matrice ATDD

| ID | Scénario | AC | Type |
|---|---|---|---|
| T2.5-01 | Liste avec limit explicite | AC#2 | Unitaire |
| T2.5-02 | Limit par défaut = 10 | AC#3 | Unitaire |
| T2.5-03 | NotFoundException si user inconnu | AC#2 | Unitaire |
| T2.5-04 | `?summary=true` → `GetTransactionsSummaryUseCase` | AC#1 | Routage |
| T2.5-05 | `?limit=5` → `GetTransactionsListUseCase` | AC#2 | Routage |
| T2.5-06 | Sans params → mode liste défaut (limit=10) | AC#3 | Routage |

---

## Tests Unitaires — `GetTransactionsListUseCase`

### T2.5-01 — Liste avec limit

```typescript
it('should return transactions list with given limit', async () => {
  const txs = Array.from({ length: 5 }, (_, i) => makeTx(`tx-${i}`));
  transactionRepository.findByOrganization.mockResolvedValue(txs);

  const result = await useCase.execute({ phoneNumber: '+22507000000', limit: 5 });

  expect(transactionRepository.findByOrganization).toHaveBeenCalledWith('org-1', { limit: 5 });
  expect(result).toHaveLength(5);
});
```

### T2.5-02 — Limit par défaut 10

```typescript
it('should use limit=10 by default', async () => {
  transactionRepository.findByOrganization.mockResolvedValue([]);

  await useCase.execute({ phoneNumber: '+22507000000' });

  expect(transactionRepository.findByOrganization).toHaveBeenCalledWith('org-1', { limit: 10 });
});
```

### T2.5-03 — User inconnu

```typescript
it('should throw NotFoundException when user not found', async () => {
  userRepository.findByPhoneNumber.mockResolvedValue(null);

  await expect(useCase.execute({ phoneNumber: '+22500000000' })).rejects.toThrow(NotFoundException);
});
```

---

## Contrat API GET /transactions — Modes

```
?summary=true  →  { totalIncome, totalExpenses, balance, recentTransactions[] }
?limit=N       →  Transaction[]  (N dernières, triées par date DESC)
(aucun param)  →  Transaction[]  (10 dernières par défaut)
```
