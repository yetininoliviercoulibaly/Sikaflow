# Story 1.2: Collecte d'Informations Business

Status: review

## Story

As a **nouvel utilisateur**,
I want **répondre à quelques questions simples sur mon activité**,
so that **mon espace soit configuré correctement pour mon type de business**.

## Acceptance Criteria

1. **Given** ZeroClaw est en mode onboarding (suite à `check_user_exists` retournant `[]`),
   **When** l'agent engage la conversation d'onboarding,
   **Then** il pose la question du nom du business en premier,
   **And** attend la réponse avant de continuer.

2. **Given** l'utilisateur a fourni le nom de son business,
   **When** ZeroClaw pose la question sur le type d'activité,
   **Then** il présente les options valides : maquis, restaurant, bar, événementiel, commerce,
   **And** mémorise le nom dans la mémoire conversationnelle (clé `onboarding.businessName`).

3. **Given** l'utilisateur a fourni le type d'activité,
   **When** ZeroClaw reçoit la réponse,
   **Then** il mémorise le type sous `onboarding.businessType`,
   **And** marque `onboarding.infoComplete = true`,
   **And** procède à la création de l'organisation (délégué à Story 1.3).

4. **Given** l'utilisateur donne un type invalide,
   **When** ZeroClaw valide la réponse,
   **Then** il reformule la question UNE seule fois avec les options valides,
   **And** accepte une réponse approximative (ex: "resto" → restaurant).

5. **Given** le flux d'onboarding est actif,
   **When** ZeroClaw compte les questions posées,
   **Then** le nombre total de questions ne dépasse JAMAIS 3 (nom + type = 2 max, la 3ème si reformulation forcée).

## Tasks / Subtasks

- [x] Task 1 : Mettre à jour `zeroclaw/system-prompt.md` — section onboarding détaillée (AC: #1, #2, #3, #4, #5)
  - [x] Subtask 1.1 : Définir le flux exact en 2 questions (nom → type)
  - [x] Subtask 1.2 : Définir les types valides + mapping fuzzy (alias acceptés)
  - [x] Subtask 1.3 : Règle stricte 3-questions maximum
  - [x] Subtask 1.4 : Comportement de reformulation (1 seul essai max)

- [x] Task 2 : Créer `zeroclaw/memory-schema.md` — documenter le schéma mémoire ZeroClaw (AC: #2, #3)
  - [x] Subtask 2.1 : Clés `onboarding.*` (businessName, businessType, infoComplete)
  - [x] Subtask 2.2 : Clés `session.*` (activeOrgId, activeOrgName)

- [x] Task 3 : Créer `zeroclaw/onboarding-conversation.md` — design de conversation (AC: #1-#5)
  - [x] Subtask 3.1 : Flow diagram (states + transitions)
  - [x] Subtask 3.2 : Exemples de conversations (happy path + retry path)

## Dev Notes

### Contexte

Story 1.2 est une story **pure ZeroClaw** — aucun changement backend requis. Le système de mémoire conversationnelle est natif à ZeroClaw (stockage PostgreSQL). L'agent mémorise les réponses sous forme de clés structurées accessibles dans les messages suivants.

### Schéma Mémoire ZeroClaw

ZeroClaw utilise une mémoire structurée par session/utilisateur. Les clés définies ici sont référencées dans le system prompt :

```
onboarding.businessName   → string  (ex: "Maquis Chez Omar")
onboarding.businessType   → string  (ex: "maquis")
onboarding.infoComplete   → boolean (true quand nom + type collectés)
session.activeOrgId       → string  (UUID org active, défini après création en Story 1.3)
session.activeOrgName     → string  (nom org active)
```

### Types d'activité valides + aliases

| Type canonique | Aliases acceptés |
|----------------|-----------------|
| `maquis` | maki, makis, le maquis |
| `restaurant` | resto, restau, restaurant |
| `bar` | bar, boite, boîte |
| `evenementiel` | event, événement, soirée, festival |
| `commerce` | boutique, shop, vente, magasin |

### Règle des 3 questions

```
Question 1 : Nom du business       → obligatoire
Question 2 : Type d'activité       → obligatoire
Question 3 (max) : Reformulation   → seulement si type invalide
→ Si toujours invalide après Q3 → défaut : "commerce"
```

### Project Structure Notes

- Aucun fichier backend modifié
- Fichiers ZeroClaw uniquement (system-prompt.md, nouveau memory-schema.md, onboarding-conversation.md)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: zeroclaw/system-prompt.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Story entièrement ZeroClaw (0 changement backend)
- Mémoire conversationnelle gérée nativement par ZeroClaw (PostgreSQL)
- Mapping fuzzy des types pour tolérer les fautes/abréviations

### File List

- `zeroclaw/system-prompt.md` (modifié — section onboarding enrichie)
- `zeroclaw/memory-schema.md` (créé)
- `zeroclaw/onboarding-conversation.md` (créé)
- `_bmad-output/stories/story-1.2.md` (créé)
- `_bmad-output/stories/story-1.2-atdd.md` (créé)
- `_bmad-output/stories/story-1.2-trace.md` (créé)
