# ATDD — Story 1.1: Détection de Nouvel Utilisateur

## Matrice de Test

| AC | Type | Scénario | Résultat Attendu |
|----|------|----------|-----------------|
| AC#1 | Unit | phoneNumber inconnu → use case retourne [] | `[]` |
| AC#2 | Unit | phoneNumber connu → use case retourne org+rôle | `[{id, name, role}]` |
| AC#3 | Unit | Use case avec phone inconnu → pas d'exception | `[]` (pas de 404/throw) |
| AC#4 | Unit | Use case avec phone connu multi-orgs | liste complète |

## Tests Unitaires Définis

### `GetOrganizationsByPhoneUseCase`

```typescript
describe('GetOrganizationsByPhoneUseCase', () => {
  it('should return empty array when phone number is unknown', ...)
  it('should return organizations with roles when phone is known', ...)
  it('should return all organizations when user belongs to multiple', ...)
})
```

## Contrats API

### `GET /organizations?phoneNumber={phone}`

**Request:**
```
GET /api/organizations?phoneNumber=+22507000000
X-API-Key: {api-key}
```

**Response 200 (inconnu):**
```json
[]
```

**Response 200 (connu):**
```json
[
  { "id": "uuid", "name": "Maquis Chez Omar", "role": "OWNER" }
]
```

**Response 400 (paramètre manquant):**
```json
{ "statusCode": 400, "message": "phoneNumber query param is required" }
```

## Critères d'Acceptance Technique

- [ ] `IOrganizationRepository.findByPhoneNumber` existe et est mockable
- [ ] Use case injecté via token `I_ORGANIZATION_REPOSITORY`
- [ ] Réponse vide = `200 OK []` (jamais 404)
- [ ] Guard = `ApiKeyGuard` uniquement sur le endpoint GET
- [ ] Tests : 0 dépendance ORM dans les tests unitaires
