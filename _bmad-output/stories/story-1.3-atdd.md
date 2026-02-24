# ATDD — Story 1.3: Création Automatique de l'Organisation

## Matrice de Test

| AC | Type | Scénario | Résultat Attendu |
|----|------|----------|-----------------|
| AC#1 | Unit | `businessType` fourni → stocké dans `settings` | `org.settings.businessType === "maquis"` |
| AC#2 | Unit | Appel sans JWT (API key only) → pas de 403 | `@Roles` supprimé, `CompositeAuthGuard` suffit |
| AC#3 | ZeroClaw | Réponse créa → écriture mémoire session.* | Tool config post-action |
| AC#4 | Unit | `businessType` absent → création normale | `org.settings.businessType === undefined` |

## Tests Unitaires

### `CreateOrganizationUseCase` — nouveaux cas

```typescript
it('should store businessType in settings when provided')
// org.settings = { currency: 'XOF', businessType: 'maquis' }

it('should create organization normally when businessType is absent')
// org.settings = { currency: 'XOF' } — pas d'erreur
```

## Contrats API

### `POST /organizations`

**Request (ZeroClaw) :**
```json
{
  "name": "Maquis Chez Omar",
  "businessType": "maquis",
  "userPhoneNumber": "+22507000000"
}
```

**Response 201 :**
```json
{
  "id": "uuid",
  "name": "Maquis Chez Omar",
  "ownerId": "user-uuid",
  "settings": { "currency": "XOF", "businessType": "maquis" },
  "createdAt": "2026-02-24T..."
}
```

**Request legacy (sans businessType) :**
```json
{ "name": "Mon Business", "userPhoneNumber": "+22507111111" }
```
→ 201 OK, `settings = { "currency": "XOF" }` (pas d'erreur)

## Critères d'Acceptance Technique

- [ ] `@Roles(UserRole.ADMIN)` retiré du `POST /organizations`
- [ ] `businessType` dans `CreateOrganizationDto` : `@IsOptional()` + `@IsString()`
- [ ] `settings.businessType` défini si `command.businessType` fourni
- [ ] Tests existants toujours verts après modification use case
- [ ] Tool ZeroClaw : paramètres `name`, `businessType`, `phoneNumber` + post-action mémoire
