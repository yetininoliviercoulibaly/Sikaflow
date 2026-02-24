# Story 2.4: Catégorisation Automatique par IA

Status: dev

## Story

As a **gérant**,
I want **que mes transactions soient catégorisées automatiquement et que je puisse les corriger**,
So that **je puisse analyser mes dépenses par catégorie sans saisie manuelle**.

## Contexte

Stories 2.1/2.2 extraient déjà une catégorie via IA et l'enregistrent.
Story 2.4 ajoute la couche de **correction post-enregistrement** :
1. La catégorie est affichée dans la confirmation de chaque transaction
2. L'utilisateur peut dire "Non, c'est Charges" → ZeroClaw met à jour via `PATCH /transactions/:id/category`
3. ZeroClaw mémorise `session.lastTransactionId` après chaque enregistrement pour pouvoir le corriger

Pas de changement sur le flux d'extraction — celui-ci est déjà en place (2.1/2.2).

## Acceptance Criteria

1. **Given** une transaction vient d'être enregistrée ("Payé 15000 au DJ"),
   **When** ZeroClaw confirme l'enregistrement,
   **Then** la catégorie est visible dans la confirmation :
   "✅ Dépense de 15 000 FCFA pour DJ enregistrée — Catégorie : Staff"
   **And** `session.lastTransactionId` est mémorisé

2. **Given** l'utilisateur dit "Non, mets Charges" ou "Change la catégorie en Charges",
   **When** `session.lastTransactionId` est défini en mémoire,
   **Then** ZeroClaw appelle `PATCH /transactions/{id}/category` avec `{ category: "Charges" }`
   **And** confirme : "✅ Catégorie mise à jour : Charges"

3. **Given** `PATCH /transactions/:id/category` (backend),
   **When** appelé avec une API Key valide et `{ category: string }`,
   **Then** la catégorie de la transaction est mise à jour en base
   **And** retourne la transaction mise à jour

4. **Given** l'utilisateur demande une correction sans transaction récente,
   **When** `session.lastTransactionId` est absent,
   **Then** ZeroClaw répond : "Je n'ai pas de transaction récente à corriger. Laquelle veux-tu modifier ?"

## Tasks / Subtasks

- [x] Task 1 : Ajouter `update` au repository (AC: #3)
  - [x] Subtask 1.1 : `update(transaction): Promise<Transaction>` dans l'interface
  - [x] Subtask 1.2 : Implémentation dans `MikroOrmTransactionRepository`

- [x] Task 2 : Créer `UpdateTransactionCategoryUseCase` (AC: #3)
  - [x] Subtask 2.1 : Trouver par ID, valider existence, mettre à jour catégorie, flush
  - [x] Subtask 2.2 : Tests unitaires (succès, transaction introuvable)

- [x] Task 3 : Ajouter `PATCH /transactions/:id/category` (AC: #3)
  - [x] Subtask 3.1 : Endpoint dans `TransactionController`
  - [x] Subtask 3.2 : Enregistrer use case dans module

- [x] Task 4 : ZeroClaw — post_actions sur record-expense/income (AC: #1)
  - [x] Subtask 4.1 : `session.lastTransactionId` mémorisé dans `record-expense.tool.yaml`
  - [x] Subtask 4.2 : `session.lastTransactionId` mémorisé dans `record-income.tool.yaml`

- [x] Task 5 : Créer `update-transaction-category.tool.yaml` (AC: #2)
- [x] Task 6 : Mettre à jour `system-prompt.md` — section correction catégorie (AC: #1, #2, #4)

## Dev Notes

### PATCH endpoint

```
PATCH /transactions/:id/category
Headers: X-API-Key: {key}
Body: { category: string }
Response: Transaction (mise à jour)
```

### Mémoire ZeroClaw post-enregistrement

Après `record_expense` ou `record_income` :
```yaml
session.lastTransactionId = {{response.id}}
session.lastTransactionCategory = {{response.category}}
session.lastTransactionType = {{response.type}}
```

### Correction Flow

1. Utilisateur : "Non, c'est Charges" / "Recatégorise en nourriture"
2. ZeroClaw normalise le type ("nourriture" → "Nourriture")
3. Appelle `update_transaction_category` avec `session.lastTransactionId` + nouvelle catégorie
4. Confirme : "✅ Catégorie mise à jour : Nourriture"

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### File List

- `backend/src/transaction/domain/ports/transaction.repository.interface.ts` (modifié)
- `backend/src/transaction/infrastructure/persistence/mikro-orm-transaction.repository.ts` (modifié)
- `backend/src/transaction/application/use-cases/update-transaction-category.use-case.ts` (créé)
- `backend/src/transaction/application/use-cases/update-transaction-category.use-case.spec.ts` (créé)
- `backend/src/transaction/application/controllers/transaction.controller.ts` (modifié)
- `backend/src/transaction/transaction.module.ts` (modifié)
- `zeroclaw/tools/record-expense.tool.yaml` (modifié — post_actions)
- `zeroclaw/tools/record-income.tool.yaml` (modifié — post_actions)
- `zeroclaw/tools/update-transaction-category.tool.yaml` (créé)
- `zeroclaw/system-prompt.md` (modifié — section correction catégorie)
