# Story 1.3: Création Automatique de l'Organisation

Status: review

## Story

As a **nouvel utilisateur ayant répondu aux questions**,
I want **que mon espace business soit créé automatiquement**,
so that **je puisse immédiatement commencer à utiliser le service**.

## Acceptance Criteria

1. **Given** les informations business sont collectées (`onboarding.businessName` + `onboarding.businessType`),
   **When** ZeroClaw appelle `POST /api/organizations` avec `{ name, businessType, phoneNumber }`,
   **Then** l'organisation est créée en base de données avec `settings.businessType` persisté,
   **And** la réponse contient `{ id, name, createdAt }`.

2. **Given** `POST /api/organizations` est appelé avec une API Key valide (ZeroClaw M2M),
   **When** aucun JWT n'est fourni,
   **Then** la requête est acceptée (200/201),
   **And** l'organisation est créée correctement.

3. **Given** l'organisation est créée,
   **When** ZeroClaw reçoit la réponse,
   **Then** il écrit en mémoire : `session.activeOrgId`, `session.activeOrgName`, `session.activeOrgRole = OWNER`,
   **And** envoie : "🎉 Ton espace [nom] est prêt ! Essaie : 'Dépense 5000 pour les boissons'".

4. **Given** `businessType` est absent du body (appel legacy sans type),
   **When** `POST /api/organizations` est appelé,
   **Then** l'organisation est créée normalement (`businessType` ignoré — champ optionnel).

## Tasks / Subtasks

- [x] Task 1 : Ajouter `businessType` au DTO et au use case (AC: #1, #4)
  - [x] Subtask 1.1 : Ajouter `businessType?: string` dans `CreateOrganizationDto` (`@IsOptional()`)
  - [x] Subtask 1.2 : Ajouter `businessType?: string` dans `CreateOrganizationCommand`
  - [x] Subtask 1.3 : Stocker `settings.businessType` dans `CreateOrganizationUseCase.execute()`

- [x] Task 2 : Corriger le guard `POST /organizations` pour autoriser API Key (AC: #2)
  - [x] Subtask 2.1 : Supprimer `@Roles(UserRole.ADMIN)` du handler `POST`
  - [x] Subtask 2.2 : `CompositeAuthGuard` (classe) suffit pour l'auth M2M

- [x] Task 3 : Tests unitaires `CreateOrganizationUseCase` avec `businessType` (AC: #1, #4)
  - [x] Subtask 3.1 : Test — `businessType` persisté dans `settings` si fourni
  - [x] Subtask 3.2 : Test — `businessType` absent → création normale sans erreur

- [x] Task 4 : Créer `zeroclaw/tools/create-organization.tool.yaml` (AC: #1, #3)
  - [x] Subtask 4.1 : Tool HTTP POST /organizations avec `name`, `businessType`, `phoneNumber`
  - [x] Subtask 4.2 : Post-action : écriture mémoire `session.*`

## Dev Notes

### Bug identifié : `@Roles(UserRole.ADMIN)` bloque ZeroClaw

Le `RolesGuard` vérifie `request.user.role`. Avec une API Key, `request.user` est `undefined`
→ `RolesGuard` retourne `false` → ZeroClaw ne peut pas créer d'organisation.

**Fix** : supprimer `@Roles(UserRole.ADMIN)` du `POST`. `CompositeAuthGuard` garantit déjà
qu'un appel sans API Key valide ni JWT est rejeté.

### `businessType` dans `settings`

L'entité `Organization` a `settings: Record<string, any>`. Le type business est stocké sous
`settings.businessType` — pas de migration nécessaire (colonne JSON existante).

```typescript
// CreateOrganizationUseCase.execute()
{ currency: command.currency || getCurrency(), businessType: command.businessType }
```

### Réponse attendue par ZeroClaw

```json
{ "id": "uuid", "name": "Maquis Chez Omar", "ownerId": "...", "settings": { "currency": "XOF", "businessType": "maquis" }, "createdAt": "..." }
```

ZeroClaw extrait `id` → `session.activeOrgId`, `name` → `session.activeOrgName`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: backend/src/organization/application/controllers/organization.controller.ts:40]
- [Source: backend/src/organization/application/use-cases/create-organization.use-case.ts]
- [Source: backend/src/organization/application/dtos/organization.dtos.ts]
- [Source: backend/src/common/guards/roles.guard.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Bug `@Roles(UserRole.ADMIN)` corrigé — ZeroClaw peut maintenant appeler POST /organizations
- `businessType` stocké dans `settings.businessType` (champ JSON existant, pas de migration)
- Tool ZeroClaw `create_organization` créé avec post-action mémoire

### File List

- `backend/src/organization/application/dtos/organization.dtos.ts` (modifié)
- `backend/src/organization/application/use-cases/create-organization.use-case.ts` (modifié)
- `backend/src/organization/application/use-cases/create-organization.use-case.spec.ts` (modifié)
- `backend/src/organization/application/controllers/organization.controller.ts` (modifié)
- `zeroclaw/tools/create-organization.tool.yaml` (créé)
- `_bmad-output/stories/story-1.3.md` (créé)
- `_bmad-output/stories/story-1.3-atdd.md` (créé)
- `_bmad-output/stories/story-1.3-trace.md` (créé)
