# Story 1.1: Détection de Nouvel Utilisateur

Status: review

## Story

As a **nouvel utilisateur WhatsApp/Telegram**,
I want **que le système détecte automatiquement que c'est ma première interaction**,
so that **je sois guidé vers la création de mon espace sans avoir à le demander**.

## Acceptance Criteria

1. **Given** un message entrant d'un numéro inconnu,
   **When** l'agent interroge l'API backend `GET /api/organizations?phoneNumber={phone}`,
   **Then** le backend retourne une liste vide `[]`,
   **And** l'agent passe en mode onboarding.

2. **Given** un message entrant d'un numéro déjà enregistré,
   **When** l'agent interroge `GET /api/organizations?phoneNumber={phone}`,
   **Then** le backend retourne la liste des organisations de l'utilisateur (avec rôle),
   **And** l'agent ne déclenche PAS le mode onboarding.

3. **Given** `GET /api/organizations?phoneNumber=+225XXXXXXXXX` est appelé,
   **When** le numéro est inconnu,
   **Then** la réponse est `200 OK` avec body `[]` (liste vide, pas de 404).

4. **Given** `GET /api/organizations?phoneNumber=+225XXXXXXXXX` est appelé,
   **When** le numéro est connu et appartient à une organisation,
   **Then** la réponse est `200 OK` avec `[{ id, name, role }]`.

## Tasks / Subtasks

- [x] Task 1 : Ajouter `findByPhoneNumber` au repository organization (AC: #3, #4)
  - [x] Subtask 1.1 : Ajouter méthode `findByPhoneNumber(phone: string): Promise<Organization[]>` à `IOrganizationRepository`
  - [x] Subtask 1.2 : Implémenter dans `MikroOrmOrganizationRepository` (JOIN users + organization_members)

- [x] Task 2 : Créer `GetOrganizationsByPhoneUseCase` (AC: #1, #2, #3, #4)
  - [x] Subtask 2.1 : Use case retournant `{ id, name, role }[]` pour un phoneNumber donné
  - [x] Subtask 2.2 : Retourner `[]` si aucune org trouvée (pas d'erreur)

- [x] Task 3 : Ajouter endpoint `GET /organizations?phoneNumber=` (AC: #3, #4)
  - [x] Subtask 3.1 : Nouveau handler `@Get()` avec `@Query('phoneNumber')` dans `OrganizationController`
  - [x] Subtask 3.2 : Guard API Key uniquement (endpoint machine-to-machine ZeroClaw)
  - [x] Subtask 3.3 : Swagger documentation

- [x] Task 4 : Tests unitaires `GetOrganizationsByPhoneUseCase` (AC: #1, #2)
  - [x] Subtask 4.1 : Test cas "téléphone inconnu → retourne []"
  - [x] Subtask 4.2 : Test cas "téléphone connu → retourne liste avec rôles"

- [x] Task 5 : Créer configuration ZeroClaw — détection nouvel utilisateur (AC: #1)
  - [x] Subtask 5.1 : Créer `zeroclaw/system-prompt.md` avec logique de détection nouvel utilisateur
  - [x] Subtask 5.2 : Créer `zeroclaw/tools/check-user-exists.tool.yaml` (tool HTTP)

## Dev Notes

### Contexte Architectural

Story 1.1 implémente deux couches :
1. **Backend (NestJS)** : Expose `GET /organizations?phoneNumber=` pour permettre à ZeroClaw de vérifier si un numéro est déjà enregistré
2. **Agent (ZeroClaw)** : Configuration du system prompt et tool HTTP pour la détection automatique

> ⚠️ Dépendance : Story 1.4 (endpoint organization) est fusionnée dans cette story car l'AC #1 exige l'endpoint pour valider la story 1.1.

### Fichiers à Créer/Modifier

**Backend :**
- `backend/src/organization/domain/ports/organization.repository.interface.ts` — ajouter `findByPhoneNumber`
- `backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts` — implémenter
- `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.ts` — nouveau
- `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.spec.ts` — tests
- `backend/src/organization/application/dtos/organization.dtos.ts` — ajouter `OrganizationWithRoleDto`
- `backend/src/organization/application/controllers/organization.controller.ts` — ajouter GET handler
- `backend/src/organization/organization.module.ts` — enregistrer nouveau use case

**ZeroClaw :**
- `zeroclaw/system-prompt.md` — instruction principale agent
- `zeroclaw/tools/check-user-exists.tool.yaml` — tool HTTP pour vérification téléphone

### Règles d'Architecture (Hexagonal Strict)

- `IOrganizationRepository` interface → token `I_ORGANIZATION_REPOSITORY`
- Le use case reçoit `phoneNumber: string`, retourne `OrganizationWithRole[]`
- Aucun import ORM dans le domain — MikroORM uniquement dans `infrastructure/persistence/`
- Controller : `@ApiKeyGuard` uniquement (M2M, pas de JWT pour cet endpoint)
- Réponse `200 OK` avec `[]` si non trouvé (sémantique REST : la ressource "liste" existe, elle est vide)

### Structure du Repository Join

```sql
SELECT o.*, om.role
FROM organization o
INNER JOIN organization_member om ON o.id = om.organization_id
INNER JOIN users u ON om.user_id = u.id
WHERE u.phone_number = $1
```

### Modèle de Réponse ZeroClaw

```json
[]                          // → mode onboarding
[{"id":"...","name":"Maquis Chez Omar","role":"OWNER"}]  // → session normale
```

### Testing Standards

- Mock `IOrganizationRepository` via `jest.fn()`
- DI via `Test.createTestingModule()` avec token `I_ORGANIZATION_REPOSITORY`
- UUID mocké globalement via `src/__mocks__/uuid.ts`

### Project Structure Notes

- Alignment : structure hexagonale confirmée (domain/application/infrastructure)
- Pas de conflits détectés avec les modules existants
- L'endpoint existant `POST /organizations` utilise `@Roles(UserRole.ADMIN)` — le nouveau `GET` est M2M (API Key uniquement)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Orchestration Agent]
- [Source: backend/src/organization/domain/ports/organization.repository.interface.ts]
- [Source: backend/src/organization/application/controllers/organization.controller.ts]
- [Source: backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Story 1.4 (backend endpoint) intégrée dans cette story car nécessaire pour les AC
- `GET /organizations?phoneNumber=` protégé par `ApiKeyGuard` uniquement (M2M ZeroClaw)
- La réponse est toujours `200 OK` avec `[]` si inconnu (sémantique REST correcte)
- ZeroClaw config créée dans `zeroclaw/` (system prompt + tool YAML)

### File List

- `backend/src/organization/domain/ports/organization.repository.interface.ts` (modifié)
- `backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts` (modifié)
- `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.ts` (créé)
- `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.spec.ts` (créé)
- `backend/src/organization/application/controllers/organization.controller.ts` (modifié)
- `backend/src/organization/organization.module.ts` (modifié)
- `zeroclaw/system-prompt.md` (créé)
- `zeroclaw/tools/check-user-exists.tool.yaml` (créé)
- `_bmad-output/stories/story-1.1-atdd.md` (créé)
