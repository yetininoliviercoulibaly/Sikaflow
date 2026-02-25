# Story 2.2: Enregistrement de Revenu par Message

Status: dev

## Story

As a **gérant**,
I want **enregistrer un revenu par message naturel**,
So that **je suive mes entrées d'argent sans effort**.

## Contexte

Story sœur de 2.1 (dépenses). Même endpoint backend `POST /transactions`, même pattern ZeroClaw.
Seule différence : `type: "INCOME"` au lieu de `"EXPENSE"`.
Le `POST /transactions` existe et fonctionne — story 100% ZeroClaw.

Comportement identique à 2.1 pour la fluidité :
- Message sans ambiguïté → enregistrement direct (pas de confirmation)
- Message ambigu → confirmation avant API

## Acceptance Criteria

1. **Given** un message sans ambiguïté "Reçu 25000 vente de billets",
   **When** ZeroClaw reçoit le message d'un utilisateur identifié,
   **Then** extrait `{ amount: 25000, type: "INCOME", description: "vente de billets", category: "Ventes" }`
   **And** appelle `POST /transactions` immédiatement
   **And** confirme : "✅ Revenu de 25 000 FCFA pour vente de billets enregistré"

2. **Given** un message ambigu (interprétation incertaine),
   **When** ZeroClaw ne peut pas extraire avec certitude montant ET description,
   **Then** résume et demande confirmation avant d'appeler l'API

3. **Given** l'utilisateur infirme après confirmation demandée,
   **When** ZeroClaw reçoit "non" / "annule",
   **Then** aucune transaction n'est créée
   **And** répond : "D'accord, dis-moi ce que tu veux corriger."

4. **Given** montant absent ou illisible,
   **When** ZeroClaw ne peut pas extraire le montant,
   **Then** demande : "Combien as-tu encaissé ?"
   **And** enregistre directement dès que le montant est fourni

5. **Given** un message "Ma caisse c'est 25000",
   **When** le contexte est ambigu (dépense ou revenu ?),
   **Then** ZeroClaw demande : "C'est une entrée ou une sortie d'argent ?"

## Tasks / Subtasks

- [x] Task 1 : Créer `record-income.tool.yaml` (AC: #1, #2)
  - [x] Subtask 1.1 : Config HTTP POST /transactions avec type=INCOME
  - [x] Subtask 1.2 : Paramètres : phoneNumber, amount, category, description
  - [x] Subtask 1.3 : response_schema, exemples, on_error

- [x] Task 2 : Mettre à jour `system-prompt.md` — section Revenu (AC: #1–#5)
  - [x] Subtask 2.1 : Détection intention revenu (mots-clés distincts de dépense)
  - [x] Subtask 2.2 : Flux direct si sans ambiguïté, confirmation si ambigu
  - [x] Subtask 2.3 : Gestion ambiguïté dépense/revenu
  - [x] Subtask 2.4 : Mapping catégories revenus

## Dev Notes

### Mots-clés revenus vs dépenses

| Revenus | Dépenses |
|---|---|
| reçu, encaissé, vendu, vente, entrée, recette, gain | dépense, payé, acheté, sortie, débours |

Le mot "25000 boissons" seul reste ambigu → demander clarification dépense/revenu.

### Catégories Revenus

| Mots-clés | Catégorie |
|---|---|
| vente, vendu, billets, tickets | Ventes |
| service, prestation, commission | Services |
| location, loyer reçu | Location |
| autre / non catégorisé | Général |

### References

- [Source: backend/src/transaction/domain/transaction.entity.ts — TransactionType.INCOME]
- [Source: backend/src/transaction/application/controllers/transaction.controller.ts]
- [Source: zeroclaw/tools/record-expense.tool.yaml — pattern à suivre]
- [Source: zeroclaw/system-prompt.md — section Gestion de Caisse]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Story 100% ZeroClaw : aucun changement backend
- POST /transactions accepte INCOME nativement (enum existant)
- Pattern identique à 2.1 : direct si clair, confirmation si ambigu
- AC#5 : gestion de l'ambiguïté dépense/revenu ajoutée

### File List

- `zeroclaw/tools/record-income.tool.yaml` (créé)
- `zeroclaw/system-prompt.md` (modifié — section Revenu ajoutée)
- `_bmad-output/stories/story-2.2.md` (créé)
- `_bmad-output/stories/story-2.2-atdd.md` (créé)
- `_bmad-output/stories/story-2.2-trace.md` (créé)
