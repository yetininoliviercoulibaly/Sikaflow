# Story 3.1: Enregistrement d'une Dette par Message

Status: done

## Story

As a **ZeroClaw agent**,
I want **pouvoir enregistrer une créance (argent que quelqu'un me doit) par message naturel**,
So that **l'utilisateur peut tracer ses dettes clients/contacts sans saisie manuelle**.

## Contexte

La gestion des dettes est un besoin clé pour les entrepreneurs africains (maquis, commerce, etc.).
Le module `contact` existant implémente déjà toute la logique métier dans `ContactService.addDebt()`.

Delta pour 3.1 :

| Composant | Statut avant 3.1 | Travail 3.1 |
|---|---|---|
| `ContactService.addDebt()` | ✅ Existant (webhook seulement) | Exposer via REST |
| `AddDebtUseCase` | ❌ Manquant | Créer wrapper mince |
| `DebtController` | ❌ Manquant | Créer `POST /debts` |
| `record-debt.tool.yaml` | ❌ Manquant | Créer tool ZeroClaw |
| system-prompt.md — section Dettes | ❌ Manquant | Ajouter flux dette |

## Acceptance Criteria

1. **Given** un message naturel contenant un débiteur + un montant (ex: "Kofi me doit 5000"),
   **When** ZeroClaw le détecte,
   **Then** appelle `POST /debts` avec `{ phoneNumber, amount, contactName, contactPhone?, description? }`
   **And** la réponse retourne le contact mis à jour avec `totalOwed` incrémenté

2. **Given** `POST /debts` avec `phoneNumber` inconnu,
   **When** appelé,
   **Then** retourne `404 Not Found`

3. **Given** `POST /debts` avec `amount <= 0` ou invalide,
   **When** appelé,
   **Then** retourne `400 Bad Request`

4. **Given** un message sans nom de débiteur ou sans montant clair,
   **When** ZeroClaw reçoit le message,
   **Then** demande les informations manquantes avant d'appeler l'API

5. **Given** une dette enregistrée avec succès,
   **When** ZeroClaw reçoit la réponse,
   **Then** confirme : "✅ Dette de 5 000 FCFA enregistrée pour Kofi (#XXXXX)"
   **And** mémorise `session.lastDebtContactName` et `session.lastDebtAmount`

## Tasks / Subtasks

- [ ] Task 1 : Créer `AddDebtUseCase` (AC: #1, #2, #3)
  - [ ] Subtask 1.1 : `AddDebtCommand { phoneNumber, amount, contactName, contactPhone?, description? }`
  - [ ] Subtask 1.2 : Résoudre user + org depuis `phoneNumber`
  - [ ] Subtask 1.3 : Déléguer à `ContactService.addDebt()`
  - [ ] Subtask 1.4 : Retourne le `Contact` mis à jour

- [ ] Task 2 : Créer `DebtController` (AC: #1, #2, #3)
  - [ ] Subtask 2.1 : `POST /debts` avec `CreateDebtDto`
  - [ ] Subtask 2.2 : Guard `400` si montant invalide (NestJS `ValidationPipe`)
  - [ ] Subtask 2.3 : Propagation `NotFoundException` → `404`

- [ ] Task 3 : Tests unitaires `AddDebtUseCase` (AC: #1, #2, #3)
  - [ ] Subtask 3.1 : Enregistrement dette avec contacte nouveau
  - [ ] Subtask 3.2 : Enregistrement dette avec contacte existant
  - [ ] Subtask 3.3 : NotFoundException si user inconnu
  - [ ] Subtask 3.4 : Erreur si montant invalide

- [ ] Task 4 : Enregistrer dans `ContactModule`

- [ ] Task 5 : Créer `zeroclaw/tools/record-debt.tool.yaml` (AC: #1, #5)

- [ ] Task 6 : Mettre à jour `zeroclaw/system-prompt.md` (AC: #4, #5)

## Dev Notes

### Endpoint cible

```
POST /debts
Body: {
  "phoneNumber": "+22507000000",
  "amount": 5000,
  "contactName": "Kofi",
  "contactPhone": "+22508000000",   // optionnel
  "description": "Boissons soirée"  // optionnel
}
Response: Contact { id, shortId, displayName, totalOwed, ... }
```

### Résolution du contexte

Pattern identique à `GetTransactionsListUseCase` :
1. `userRepository.findByPhoneNumber(phoneNumber)` → `userId`
2. `resolveContextUseCase.execute({ phoneNumber })` → `organizationId`
3. `contactService.addDebt(userId, organizationId, { amount, contactName, contactPhone, description })`

### Comportement ZeroClaw — Ambiguïté

- Message unambiguïté (débiteur ET montant clairs) → enregistre directement
- Débiteur absent → "Qui te doit cet argent ?"
- Montant absent → "Quel montant ?"
- Confirmation après enregistrement : "✅ Dette de **5 000 FCFA** enregistrée pour Kofi (#XXXXX)"

### References

- [Source: backend/src/contact/application/services/contact.service.ts:24-60]
- [Source: backend/src/contact/domain/contact.entity.ts]
- [Source: backend/src/transaction/application/use-cases/get-transactions-list.use-case.ts — pattern résolution contexte]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Wrapper mince : toute la logique métier reste dans `ContactService.addDebt()` — use case ne fait que résoudre le contexte
- `ResolveContextUseCase` appelle aussi `userRepository.findByPhoneNumber` en interne — double appel DB acceptable MVP (cohérent avec GetTransactionsListUseCase)
- Warning Jest "worker force exited" dans contact.service.spec.ts — pré-existant, non introduit par 3.1
- `OrganizationModule` ajouté au ContactModule pour exposer `ResolveContextUseCase`

### File List

- `backend/src/contact/application/use-cases/add-debt.use-case.ts` (créé)
- `backend/src/contact/application/use-cases/add-debt.use-case.spec.ts` (créé)
- `backend/src/contact/application/controllers/debt.controller.ts` (créé)
- `backend/src/contact/contact.module.ts` (modifié)
- `zeroclaw/tools/record-debt.tool.yaml` (créé)
- `zeroclaw/system-prompt.md` (modifié)
- `_bmad-output/stories/story-3.1.md` (créé)
- `_bmad-output/stories/story-3.1-atdd.md` (créé)
- `_bmad-output/stories/story-3.1-trace.md` (créé)

