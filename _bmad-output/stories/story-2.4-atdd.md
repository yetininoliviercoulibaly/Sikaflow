# ATDD — Story 2.4 : Catégorisation Automatique et Correction

## Stratégie de Test

Story mixte : backend (use case + endpoint) + ZeroClaw (post_actions + correction flow).

| Couche | Approche |
|--------|----------|
| `UpdateTransactionCategoryUseCase` | Tests unitaires Jest |
| `PATCH /transactions/:id/category` | Couvert par use case test |
| Mémorisation `lastTransactionId` | Contrat `post_actions` dans tools YAML |
| Correction catégorie ZeroClaw | Scénarios Gherkin |

---

## Matrice ATDD

| ID | Scénario | AC | Type |
|---|---|---|---|
| T2.4-01 | Mise à jour catégorie — succès | AC#3 | Unitaire |
| T2.4-02 | Transaction introuvable → NotFoundException | AC#3 | Unitaire |
| T2.4-03 | Catégorie visible dans confirmation | AC#1 | Contrat YAML |
| T2.4-04 | lastTransactionId mémorisé après enregistrement | AC#1 | Contrat YAML |
| T2.4-05 | Correction catégorie — flux complet | AC#2 | Comportemental |
| T2.4-06 | Pas de transaction récente → message explicatif | AC#4 | Comportemental |

---

## Tests Unitaires — `UpdateTransactionCategoryUseCase`

### T2.4-01 — Mise à jour réussie

```typescript
it('should update the transaction category', async () => {
  const tx = makeTx('tx-1', 'Staff');
  transactionRepository.findById.mockResolvedValue(tx);
  transactionRepository.update.mockResolvedValue({ ...tx, category: 'Charges' });

  const result = await useCase.execute({ transactionId: 'tx-1', category: 'Charges' });

  expect(transactionRepository.update).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'tx-1', category: 'Charges' })
  );
  expect(result.category).toBe('Charges');
});
```

### T2.4-02 — Transaction introuvable

```typescript
it('should throw NotFoundException when transaction not found', async () => {
  transactionRepository.findById.mockResolvedValue(null);

  await expect(
    useCase.execute({ transactionId: 'unknown-id', category: 'Nourriture' })
  ).rejects.toThrow(NotFoundException);
});
```

---

## Scénarios Gherkin ZeroClaw

### T2.4-03 — Catégorie dans la confirmation

```gherkin
Scenario: Catégorie visible après enregistrement de dépense
  Given "Payé 15000 au DJ"
  When ZeroClaw enregistre via record_expense (category="Staff")
  Then la confirmation inclut la catégorie :
    "✅ Dépense de 15 000 FCFA pour DJ enregistrée — Catégorie : Staff"
```

### T2.4-04 — Mémorisation post_actions

```gherkin
Scenario: session.lastTransactionId mémorisé après enregistrement
  Given record_expense répond { id: "tx-abc", category: "Staff", ... }
  When post_actions s'exécutent
  Then session.lastTransactionId = "tx-abc"
  And session.lastTransactionCategory = "Staff"
```

### T2.4-05 — Correction de catégorie

```gherkin
Scenario: Utilisateur corrige la catégorie immédiatement
  Given session.lastTransactionId = "tx-abc"
  And l'utilisateur dit "Non, c'est Charges" ou "Change en charges"
  When ZeroClaw reçoit le message
  Then il normalise "charges" → "Charges"
  And appelle PATCH /transactions/tx-abc/category avec { category: "Charges" }
  And confirme "✅ Catégorie mise à jour : Charges"

Scenario: Correction par message explicite
  Given session.lastTransactionId = "tx-abc"
  And l'utilisateur dit "Recatégorise en nourriture"
  When ZeroClaw reçoit le message
  Then il normalise "nourriture" → "Nourriture"
  And appelle PATCH /transactions/tx-abc/category avec { category: "Nourriture" }
```

### T2.4-06 — Pas de transaction récente

```gherkin
Scenario: Correction sans contexte
  Given session.lastTransactionId est absent
  And l'utilisateur dit "Change la catégorie"
  When ZeroClaw reçoit le message
  Then il répond "Je n'ai pas de transaction récente à corriger. Laquelle veux-tu modifier ?"
  And n'appelle pas l'API
```
