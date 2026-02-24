# Story 3.2: Consultation de la Liste des Dettes

Status: dev

## Story

As a **ZeroClaw agent**,
I want **pouvoir consulter la liste de toutes les créances en attente**,
So that **l'utilisateur sait qui lui doit de l'argent et pour quel montant total**.

## Contexte

Story 3.1 a introduit `POST /debts` pour enregistrer une créance.
Delta pour 3.2 :

| Composant | Statut avant 3.2 | Travail 3.2 |
|---|---|---|
| `IContactRepository.findWithPendingDebts()` | ✅ Existant | Exposer via use case + REST |
| `GetDebtsListUseCase` | ❌ Manquant | Créer |
| `GET /debts` | ❌ Manquant | Ajouter dans `DebtController` |
| `get-debts.tool.yaml` | ❌ Manquant | Créer tool ZeroClaw |
| system-prompt.md — section Consultation Dettes | ❌ Manquant | Ajouter flux |

## Acceptance Criteria

1. **Given** `GET /debts?phoneNumber={phone}`,
   **When** appelé avec une API Key valide,
   **Then** retourne un tableau des contacts ayant `totalOwed > 0`
   **And** chaque entrée contient `{ id, shortId, displayName, totalOwed, phone? }`

2. **Given** aucune créance en attente,
   **When** appelé,
   **Then** retourne un tableau vide `[]`

3. **Given** `GET /debts?phoneNumber={phone}` avec `phoneNumber` inconnu,
   **When** appelé,
   **Then** retourne `404 Not Found`

4. **Given** un message de consultation ("qui me doit", "mes dettes", "liste créances"),
   **When** ZeroClaw reçoit le message,
   **Then** appelle `get_debts` et formate la liste avec montants et shortIds

5. **Given** liste vide retournée,
   **When** ZeroClaw reçoit la réponse,
   **Then** répond : "Tu n'as aucune créance en attente pour l'instant."

## Tasks / Subtasks

- [ ] Task 1 : Créer `GetDebtsListUseCase` (AC: #1, #2, #3)
  - [ ] Subtask 1.1 : `GetDebtsListCommand { phoneNumber }`
  - [ ] Subtask 1.2 : Résoudre user + org depuis `phoneNumber`
  - [ ] Subtask 1.3 : Appeler `contactRepository.findWithPendingDebts(userId, orgId)`
  - [ ] Subtask 1.4 : Retourner `Contact[]`

- [ ] Task 2 : Ajouter `GET /debts` dans `DebtController` (AC: #1, #2)
  - [ ] Subtask 2.1 : `@Get()` avec `@Query('phoneNumber')`
  - [ ] Subtask 2.2 : Guard `400` si `phoneNumber` absent

- [ ] Task 3 : Tests unitaires `GetDebtsListUseCase` (AC: #1, #2, #3)
  - [ ] Subtask 3.1 : Liste avec plusieurs créances
  - [ ] Subtask 3.2 : Liste vide (aucune créance)
  - [ ] Subtask 3.3 : NotFoundException si user inconnu

- [ ] Task 4 : Enregistrer dans `ContactModule`

- [ ] Task 5 : Créer `zeroclaw/tools/get-debts.tool.yaml` (AC: #4, #5)

- [ ] Task 6 : Mettre à jour `zeroclaw/system-prompt.md` (AC: #4, #5)

## Dev Notes

### Endpoint cible

```
GET /debts?phoneNumber=+22507000000
Response: Contact[] [
  { id, shortId, displayName, totalOwed, phone? },
  ...
]
```

### Résolution du contexte

Pattern identique aux use cases précédents :
1. `userRepository.findByPhoneNumber(phoneNumber)` → userId
2. `resolveContextUseCase.execute({ phoneNumber })` → organizationId
3. `contactRepository.findWithPendingDebts(userId, orgId)`

### ZeroClaw — Formatage liste

```
📋 Tes créances — [orgName]

1. Kofi (#BC12AB) — 5 000 FCFA
2. Bakary (#AX78CD) — 25 000 FCFA
─────────────────
Total dû : 30 000 FCFA
```

### References

- [Source: backend/src/contact/domain/ports/contact.repository.interface.ts:44]
- [Source: backend/src/contact/application/use-cases/add-debt.use-case.ts — pattern résolution]
- [Source: backend/src/contact/application/controllers/debt.controller.ts — controller existant]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

### File List

