# Story 3.3: Règlement d'une Dette

Status: dev

## Story

As a **ZeroClaw agent**,
I want **pouvoir enregistrer le remboursement total ou partiel d'une créance**,
So that **l'utilisateur peut marquer qu'un débiteur l'a remboursé, partiellement ou intégralement**.

## Contexte

Stories 3.1–3.2 ont introduit l'enregistrement et la consultation des dettes.
Delta pour 3.3 :

| Composant | Statut avant 3.3 | Travail 3.3 |
|---|---|---|
| `ContactService.settleDebt()` | ✅ Existant (webhook seulement) | Exposer via REST |
| `SettleDebtUseCase` | ❌ Manquant | Créer wrapper mince |
| `PATCH /debts/:shortId/settle` | ❌ Manquant | Ajouter dans `DebtController` |
| `settle-debt.tool.yaml` | ❌ Manquant | Créer tool ZeroClaw |
| system-prompt.md — section Règlement | ❌ Manquant | Ajouter flux |

## Acceptance Criteria

1. **Given** `PATCH /debts/:shortId/settle` avec `{ phoneNumber, amount? }`,
   **When** appelé avec une API Key valide et un shortId connu,
   **Then** réduit `totalOwed` du contact et crée une transaction INCOME (audit trail)
   **And** retourne `{ contact, settledAmount, remaining }`

2. **Given** un règlement sans `amount` (montant absent),
   **When** appelé,
   **Then** règle la totalité du solde dû (`remaining = 0`)

3. **Given** un `amount` supérieur à `totalOwed`,
   **When** appelé,
   **Then** règle uniquement le solde dû (cap automatique — `remaining = 0`)

4. **Given** un `shortId` inconnu ou contact sans créance,
   **When** appelé,
   **Then** retourne `404 Not Found`

5. **Given** `phoneNumber` inconnu,
   **When** appelé,
   **Then** retourne `404 Not Found`

6. **Given** un message de règlement ("Kofi m'a remboursé", "il a payé"),
   **When** ZeroClaw le détecte,
   **Then** appelle `settle_debt` avec `short_id` (depuis `session.lastDebtContactShortId` ou contexte) et confirme :
   - Règlement total → "✅ Kofi a tout remboursé — créance soldée !"
   - Règlement partiel → "✅ Kofi a remboursé **5 000 FCFA** — Reste dû : **10 000 FCFA**"

## Tasks / Subtasks

- [ ] Task 1 : Créer `SettleDebtUseCase` (AC: #1, #2, #3, #4, #5)
  - [ ] Subtask 1.1 : `SettleDebtCommand { phoneNumber, shortId, amount? }`
  - [ ] Subtask 1.2 : Résoudre user + org depuis `phoneNumber`
  - [ ] Subtask 1.3 : Déléguer à `ContactService.settleDebt()` avec `contactShortId`
  - [ ] Subtask 1.4 : Lever `NotFoundException` si résultat null

- [ ] Task 2 : Ajouter `PATCH /debts/:shortId/settle` dans `DebtController` (AC: #1, #4)
  - [ ] Subtask 2.1 : `@Patch(':shortId/settle')` avec `SettleDebtDto { phoneNumber, amount? }`

- [ ] Task 3 : Tests unitaires `SettleDebtUseCase` (AC: #1, #2, #3, #4, #5)
  - [ ] Subtask 3.1 : Règlement total (sans amount)
  - [ ] Subtask 3.2 : Règlement partiel (avec amount)
  - [ ] Subtask 3.3 : NotFoundException si contact non trouvé (settleDebt → null)
  - [ ] Subtask 3.4 : NotFoundException si user inconnu

- [ ] Task 4 : Enregistrer dans `ContactModule`

- [ ] Task 5 : Créer `zeroclaw/tools/settle-debt.tool.yaml` (AC: #6)

- [ ] Task 6 : Mettre à jour `zeroclaw/system-prompt.md` (AC: #6)

## Dev Notes

### Endpoint cible

```
PATCH /debts/:shortId/settle
Body: { "phoneNumber": "+22507000000", "amount": 5000 }   // amount optionnel
Response: {
  "contact": { id, shortId, displayName, totalOwed },
  "settledAmount": 5000,
  "remaining": 0
}
```

### Comportement `ContactService.settleDebt()`

- Trouve le contact par `contactShortId` (priorité) ou `contactName`
- `amount` absent → règle la totalité
- `amount > totalOwed` → cap automatique à `totalOwed`
- Retourne `null` si contact non trouvé → use case lève `NotFoundException`

### ZeroClaw — Résolution du shortId

ZeroClaw peut récupérer le `shortId` :
1. Depuis `session.lastDebtContactShortId` (mémorisé par `record_debt`)
2. Depuis la liste `get_debts` (le contact mentionne son nom ou son shortId)
3. Depuis un message direct "Kofi (#BC12AB) m'a remboursé"

Si shortId absent → appelle `get_debts` pour afficher la liste et demander lequel.

### References

- [Source: backend/src/contact/application/services/contact.service.ts:104-148]
- [Source: backend/src/contact/application/use-cases/add-debt.use-case.ts — pattern]
- [Source: backend/src/contact/application/controllers/debt.controller.ts — controller existant]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

### File List

