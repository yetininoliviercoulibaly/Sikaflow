# Story 1.4: [ADAPTER] API Backend — Endpoint Organisation

Status: review

## Story

As a **ZeroClaw agent**,
I want **un endpoint REST complet pour vérifier et créer des organisations**,
so that **je puisse automatiser l'onboarding avec toutes les informations nécessaires**.

## Contexte

Stories 1.1 et 1.3 ont déjà implémenté les deux endpoints. Le seul delta :
`GET /organizations?phoneNumber=` retourne `{ id, name, role }` mais l'AC exige `{ id, name, **type**, role }`.
`type` = `settings->>'businessType'` (colonne jsonb PostgreSQL).

## Acceptance Criteria

1. **Given** `GET /organizations?phoneNumber=+225...` est appelé,
   **When** l'utilisateur a des organisations,
   **Then** retourne `[{ id, name, type, role }]` — `type` extrait de `settings.businessType`.

2. **Given** `GET /organizations?phoneNumber=+225...` est appelé,
   **When** l'organisation n'a pas de `businessType` dans ses settings,
   **Then** `type` est `null` dans la réponse (pas d'erreur).

3. **Given** `POST /organizations` avec `{ name, businessType, phoneNumber }`,
   **When** l'organisation est créée,
   **Then** la réponse inclut `settings.businessType` (couvert par Story 1.3 ✅).

## Tasks / Subtasks

- [x] Task 1 : Ajouter `type` à `OrganizationWithRole` (AC: #1, #2)
  - [x] Subtask 1.1 : `type?: string | null` dans l'interface `OrganizationWithRole`
  - [x] Subtask 1.2 : SQL `o.settings->>'businessType' as type` dans `findByPhoneNumber`
  - [x] Subtask 1.3 : Mapping `row.type ?? null` dans le résultat

- [x] Task 2 : Mise à jour tests `GetOrganizationsByPhoneUseCase` (AC: #1, #2)
  - [x] Subtask 2.1 : Test — retourne `type: "maquis"` quand businessType défini
  - [x] Subtask 2.2 : Test — retourne `type: null` quand businessType absent

## Dev Notes

### Extraction JSON PostgreSQL via Knex

```typescript
knex.raw("o.settings->>'businessType'")
// ou en Knex builder :
knex('organization as o').select(knex.raw("o.settings->>'businessType' as type"))
```

### Interface mise à jour

```typescript
export interface OrganizationWithRole {
  id: string;
  name: string;
  type: string | null;  // settings.businessType
  role: string;
}
```

### Impact

- `GetOrganizationsByPhoneUseCase` : aucun changement (délègue au repository)
- `check-user-exists.tool.yaml` : le champ `type` apparaît naturellement dans la réponse

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: backend/src/organization/domain/ports/organization.repository.interface.ts]
- [Source: backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts:60-73]
- [Source: backend/src/organization/infrastructure/persistence/organization.schema.ts] — settings: jsonb

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Delta minimal : uniquement `type` ajouté à `OrganizationWithRole` + SQL jsonb
- Aucun changement de controller ni de use case nécessaire
- `check-user-exists.tool.yaml` enrichi pour documenter le nouveau champ

### File List

- `backend/src/organization/domain/ports/organization.repository.interface.ts` (modifié)
- `backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts` (modifié)
- `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.spec.ts` (modifié)
- `zeroclaw/tools/check-user-exists.tool.yaml` (modifié — champ `type` documenté)
- `_bmad-output/stories/story-1.4.md` (créé)
- `_bmad-output/stories/story-1.4-atdd.md` (créé)
- `_bmad-output/stories/story-1.4-trace.md` (créé)
