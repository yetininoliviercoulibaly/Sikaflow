# Matrice de Traçabilité — Story 2.1

## Coverage par rapport aux stories précédentes

| Prérequis | Couvert par | Statut |
|----|-------------|--------|
| `POST /transactions` existe | Backend pré-existant | ✅ |
| `POST /transactions` accessible via API Key | Backend pré-existant (`ApiKeyGuard`) | ✅ |
| `session.activeOrgId` disponible en mémoire | Stories 1.1–1.4 (onboarding) | ✅ |
| ZeroClaw system prompt opérationnel | Stories 1.1–1.2 | ✅ |

## Couverture AC Story 2.1

| AC | Statut | Artefact |
|----|--------|---------:|
| AC#1 — Extraction IA + confirmation avant API | ✅ | `system-prompt.md` section Gestion de Caisse |
| AC#2 — POST /transactions après confirmation | ✅ | `record-expense.tool.yaml` |
| AC#3 — Annulation propre sans appel API | ✅ | `system-prompt.md` — flux annulation |
| AC#4 — Message ambigu → confirmation quand même | ✅ | `system-prompt.md` — détection intention |
| AC#5 — Montant absent → question clarification | ✅ | `system-prompt.md` — fallback extraction |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `zeroclaw/tools/record-expense.tool.yaml` | Créé | Tool HTTP POST /transactions (type=EXPENSE) |
| `zeroclaw/system-prompt.md` | Modifié | Section "Gestion de Caisse" — flux extraction + confirmation + catégories |

## Fichiers Non Modifiés (intentionnel)

| Fichier | Raison |
|---------|--------|
| `backend/src/transaction/application/controllers/transaction.controller.ts` | POST /transactions existant, aucun changement requis |
| `backend/src/transaction/application/use-cases/create-transaction.use-case.ts` | Logique existante, réutilisée telle quelle |

## Dépendances

- **Dépend de** : Stories 1.1–1.4 (onboarding complet, session.activeOrgId en mémoire)
- **Prépare** : Story 2.2 (revenus), Story 2.3 (consultation solde), Story 2.4 (catégorisation avancée)
- **Utilise** : `POST /transactions` (backend pré-existant, aucun changement)
