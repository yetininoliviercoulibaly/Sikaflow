# ATDD — Story 2.3 : Consultation du Solde et des Dernières Transactions

## Stratégie de Test

Story mixte : backend (use case + endpoint) + ZeroClaw (tool + system-prompt).

| Couche | Approche | Outil |
|--------|----------|-------|
| `GetTransactionsSummaryUseCase` | Tests unitaires Jest | Mock repository + mock resolveContext |
| `GET /transactions` endpoint | Couvert par use case test (controller léger) | — |
| Formatage message ZeroClaw | Scénarios Gherkin comportementaux | — |
| Tool YAML `get-balance` | Validation de schéma | — |

---

## Matrice ATDD

| ID | Scénario | AC | Type | Cible |
|---|---|---|---|---|
| T2.3-01 | Résumé avec INCOME et EXPENSE | AC#3 | Unitaire | `GetTransactionsSummaryUseCase` |
| T2.3-02 | Caisse vide → balance=0 | AC#2, #3 | Unitaire | `GetTransactionsSummaryUseCase` |
| T2.3-03 | DEBT/CREDIT exclus des totaux | AC#3 | Unitaire | `GetTransactionsSummaryUseCase` |
| T2.3-04 | Réponse formatée WhatsApp | AC#1 | Comportemental | ZeroClaw |
| T2.3-05 | Caisse vide → message encouragement | AC#2 | Comportemental | ZeroClaw |
| T2.3-06 | Détection intention "solde" | AC#1 | Comportemental | ZeroClaw |

---

## Tests Unitaires — `GetTransactionsSummaryUseCase`

### T2.3-01 — Résumé avec transactions mixtes

```typescript
it('should compute correct totals from INCOME and EXPENSE transactions', async () => {
  // Arrange
  mockOrg = { id: 'org-1' };
  mockTransactions = [
    makeTx('INCOME', 25000, 'Ventes', 'vente de billets'),
    makeTx('INCOME', 50000, 'Services', 'prestation soirée'),
    makeTx('EXPENSE', 5000, 'Boissons', 'boissons'),
    makeTx('EXPENSE', 2000, 'Transport', 'transport'),
  ];

  // Act
  const result = await useCase.execute({ phoneNumber: '+22507000000' });

  // Assert
  expect(result.totalIncome).toBe(75000);
  expect(result.totalExpenses).toBe(7000);
  expect(result.balance).toBe(68000);
  expect(result.recentTransactions).toHaveLength(4);
});
```

### T2.3-02 — Caisse vide

```typescript
it('should return zero totals when no transactions', async () => {
  mockTransactions = [];

  const result = await useCase.execute({ phoneNumber: '+22507000000' });

  expect(result.totalIncome).toBe(0);
  expect(result.totalExpenses).toBe(0);
  expect(result.balance).toBe(0);
  expect(result.recentTransactions).toHaveLength(0);
});
```

### T2.3-03 — DEBT/CREDIT exclus

```typescript
it('should exclude DEBT and CREDIT from totals', async () => {
  mockTransactions = [
    makeTx('INCOME', 10000, 'Ventes', 'vente'),
    makeTx('DEBT', 5000, 'Général', 'dette Omar'),     // ignoré
    makeTx('CREDIT', 3000, 'Général', 'crédit Fatou'), // ignoré
  ];

  const result = await useCase.execute({ phoneNumber: '+22507000000' });

  expect(result.totalIncome).toBe(10000);
  expect(result.totalExpenses).toBe(0);
  expect(result.balance).toBe(10000);
});
```

---

## Scénarios Gherkin ZeroClaw

### T2.3-04 — Formatage réponse

```gherkin
Scenario: Affichage résumé formaté après demande de solde
  Given un utilisateur identifié avec transactions en base
  And GET /transactions?summary=true retourne {
    totalIncome: 75000, totalExpenses: 7000, balance: 68000,
    recentTransactions: [{ type: INCOME, amount: 25000, description: "vente de billets" }, ...]
  }
  When ZeroClaw reçoit la réponse
  Then il formate et envoie :
    """
    💰 Ta caisse — [Nom org]
    Revenus    : 75 000 FCFA
    Dépenses   : 7 000 FCFA
    ─────────────────────
    Solde net  : 68 000 FCFA

    Dernières opérations :
    ✅ +25 000 — vente de billets
    🔴 -5 000 — boissons
    """
```

### T2.3-05 — Caisse vide

```gherkin
Scenario: Réponse encourageante si caisse vide
  Given GET /transactions?summary=true retourne balance=0, recentTransactions=[]
  When ZeroClaw formate la réponse
  Then il répond "Ta caisse est vide pour l'instant. Enregistre ta première dépense ou ton premier revenu !"
```

### T2.3-06 — Détection intention

```gherkin
Scenario: Variantes de messages déclenchant la consultation
  Given "Ma caisse"         → appelle get_balance
  Given "Mon solde"         → appelle get_balance
  Given "Où j'en suis ?"   → appelle get_balance
  Given "État de ma caisse" → appelle get_balance
  Given "Mes transactions"  → appelle get_balance
```

---

## Contrat Tool YAML — `get-balance.tool.yaml`

```yaml
name: get_balance
type: http_request
config:
  method: GET
  url: "{{SIKAFLOW_API_URL}}/transactions"
  query_params:
    phoneNumber: "{{phone_number}}"
    summary: "true"
parameters:
  - name: phone_number   # required
response_schema:
  type: object
  properties:
    totalIncome: number
    totalExpenses: number
    balance: number
    recentTransactions:
      type: array
      items: { id, type, amount, category, description, transactionDate }
```
