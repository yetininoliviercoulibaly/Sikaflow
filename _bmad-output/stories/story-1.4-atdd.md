# ATDD — Story 1.4: Endpoint Organisation

## Delta par rapport aux stories précédentes

| Endpoint | Story | Statut |
|----------|-------|--------|
| `GET /organizations?phoneNumber=` | 1.1 | ✅ existe — manque `type` |
| `POST /organizations` + `businessType` | 1.3 | ✅ complet |

## Tests à ajouter / modifier

### `GetOrganizationsByPhoneUseCase`

```typescript
it('should return type when businessType is set in organization')
// result[0].type === "maquis"

it('should return null type when businessType is absent')
// result[0].type === null
```

## Contrats API mis à jour

### `GET /organizations?phoneNumber=+22507000000`

**Response (avec type) :**
```json
[
  { "id": "uuid", "name": "Maquis Chez Omar", "type": "maquis", "role": "OWNER" }
]
```

**Response (sans businessType en base) :**
```json
[
  { "id": "uuid", "name": "Mon Business", "type": null, "role": "MANAGER" }
]
```

**Response (inconnu) :**
```json
[]
```

## Critères d'Acceptance Technique

- [ ] `OrganizationWithRole.type: string | null` dans l'interface
- [ ] SQL : `o.settings->>'businessType' as type` dans `findByPhoneNumber`
- [ ] Mapping : `type: row.type ?? null`
- [ ] Tests : 2 nouveaux cas (avec/sans type)
- [ ] `check-user-exists.tool.yaml` : `type` documenté dans response_schema
