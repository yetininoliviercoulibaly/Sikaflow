# Story 2.1: Enregistrement de Dépense par Message

Status: dev

## Story

As a **gérant de maquis/restaurant**,
I want **enregistrer une dépense en envoyant un message texte naturel**,
So that **ma comptabilité soit à jour sans effort**.

## Contexte

L'endpoint `POST /transactions` existe déjà dans le backend, protégé par `ApiKeyGuard`.
Il accepte : `{ phoneNumber, amount, category, description, type: "EXPENSE" }`.
La story est **100% ZeroClaw** : system prompt + tool YAML uniquement.

Story 2.2 (revenus), 2.3 (solde), 2.4 (catégorisation avancée) sont des stories sœurs.
Pour 2.1, la catégorie est extraite par IA depuis le message — pas de confirmation séparée de la catégorie.

## Acceptance Criteria

1. **Given** un message sans ambiguïté "Dépense 5000 pour les boissons",
   **When** ZeroClaw reçoit le message d'un utilisateur identifié,
   **Then** l'agent extrait `{ amount: 5000, type: "EXPENSE", description: "boissons", category: "Boissons" }`
   **And** appelle `POST /transactions` **immédiatement**
   **And** confirme : "✅ Dépense de 5 000 FCFA pour les boissons enregistrée"

2. **Given** un message ambigu (interprétation incertaine),
   **When** ZeroClaw ne peut pas extraire avec certitude montant ET description,
   **Then** il résume l'interprétation et demande confirmation avant d'appeler l'API

3. **Given** l'utilisateur infirme ("non", "annule") après une demande de confirmation,
   **When** ZeroClaw reçoit la réponse négative,
   **Then** aucune transaction n'est créée
   **And** ZeroClaw répond : "D'accord, dis-moi ce que tu veux corriger."

4. **Given** un message clair sans le mot "dépense" comme "5000 boissons",
   **When** montant ET description sont identifiables sans ambiguïté,
   **Then** ZeroClaw enregistre directement (pas de confirmation)

5. **Given** un montant illisible ou absent,
   **When** ZeroClaw ne peut pas extraire le montant,
   **Then** il demande : "Je n'ai pas compris le montant. Combien as-tu dépensé ?"

## Tasks / Subtasks

- [x] Task 1 : Créer `record-expense.tool.yaml` (AC: #1, #2)
  - [x] Subtask 1.1 : Config HTTP POST /transactions avec type=EXPENSE
  - [x] Subtask 1.2 : Paramètres : phoneNumber, amount, category, description
  - [x] Subtask 1.3 : response_schema et exemples

- [x] Task 2 : Mettre à jour `system-prompt.md` — section Gestion de Caisse (AC: #1–#5)
  - [x] Subtask 2.1 : Détection intention dépense depuis message naturel
  - [x] Subtask 2.2 : Flux d'extraction + confirmation avant appel API
  - [x] Subtask 2.3 : Gestion annulation et montant ambigu
  - [x] Subtask 2.4 : Mapping catégories par défaut

## Dev Notes

### Endpoint Backend (existant)

```
POST /transactions
Headers: X-API-Key: {key}
Body: {
  phoneNumber: string,
  amount: number,
  type: "EXPENSE",
  category: string,
  description?: string
}
```

### Catégories par défaut (pour extraction IA)

| Mots-clés | Catégorie |
|---|---|
| boissons, bières, sodas, eau, alcool | Boissons |
| nourriture, repas, viande, riz, légumes | Nourriture |
| staff, salaire, DJ, employé, gardien | Staff |
| loyer, location, matériel, équipement | Charges |
| transport, carburant, taxi | Transport |
| autre / non catégorisé | Général |

### Confirmation Pattern

ZeroClaw doit toujours confirmer avant d'appeler l'API :
1. Extrait les données via IA
2. Reformate le montant (5000 → "5 000 FCFA")
3. Demande confirmation
4. Sur "oui" → appelle le tool
5. Sur "non" → annule

### References

- [Source: backend/src/transaction/application/controllers/transaction.controller.ts]
- [Source: backend/src/transaction/application/use-cases/create-transaction.use-case.ts]
- [Source: backend/src/transaction/domain/transaction.entity.ts — TransactionType.EXPENSE]
- [Source: zeroclaw/system-prompt.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Story 100% ZeroClaw : aucun changement backend requis
- POST /transactions existe et est opérationnel (ApiKeyGuard)
- Catégorie extraite automatiquement par IA depuis la description
- Pattern confirmation obligatoire avant appel API (sécurité anti-erreur)

### File List

- `zeroclaw/tools/record-expense.tool.yaml` (créé)
- `zeroclaw/system-prompt.md` (modifié — section Gestion de Caisse ajoutée)
- `_bmad-output/stories/story-2.1.md` (créé)
- `_bmad-output/stories/story-2.1-atdd.md` (créé)
- `_bmad-output/stories/story-2.1-trace.md` (créé)
