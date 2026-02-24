# Matrice de Traçabilité — Story 2.2

## Coverage par rapport aux stories précédentes

| Prérequis | Couvert par | Statut |
|----|-------------|--------|
| `POST /transactions` existe avec type INCOME | Backend pré-existant | ✅ |
| `POST /transactions` accessible via API Key | Backend pré-existant | ✅ |
| `session.activeOrgId` en mémoire | Stories 1.1–1.4 | ✅ |
| Pattern confirmation/direct (Story 2.1) | Story 2.1 | ✅ |
| Section Gestion de Caisse dans system-prompt | Story 2.1 | ✅ |

## Couverture AC Story 2.2

| AC | Statut | Artefact |
|----|--------|---------|
| AC#1 — Revenu clair → enregistrement direct | ✅ | `system-prompt.md` + `record-income.tool.yaml` |
| AC#2 — Message ambigu → confirmation avant API | ✅ | `system-prompt.md` — flux ambigu |
| AC#3 — Annulation propre | ✅ | `system-prompt.md` — sur annulation |
| AC#4 — Montant absent → question courte | ✅ | `system-prompt.md` — montant absent |
| AC#5 — Ambiguïté dépense/revenu → clarification | ✅ | `system-prompt.md` — section ambiguïté |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `zeroclaw/tools/record-income.tool.yaml` | Créé | Tool HTTP POST /transactions (type=INCOME) |
| `zeroclaw/system-prompt.md` | Modifié | Section "Revenu" + gestion ambiguïté dépense/revenu |

## Fichiers Non Modifiés (intentionnel)

| Fichier | Raison |
|---------|--------|
| `backend/src/transaction/application/controllers/transaction.controller.ts` | POST /transactions avec INCOME déjà supporté |
| `zeroclaw/tools/record-expense.tool.yaml` | Aucun changement requis |

## Dépendances

- **Dépend de** : Story 2.1 (pattern direct/confirmation, section Gestion de Caisse)
- **Prépare** : Story 2.3 (consultation solde — lit les INCOME + EXPENSE enregistrés)
- **Utilise** : `POST /transactions` (TransactionType.INCOME — backend pré-existant)
