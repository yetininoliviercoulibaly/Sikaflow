# Matrice de Traçabilité — Story 1.4

## Coverage par rapport aux stories précédentes

| AC | Couvert par | Statut |
|----|-------------|--------|
| `GET /organizations?phoneNumber=` existe | Story 1.1 | ✅ |
| `GET` retourne `type` | **Story 1.4** | ✅ |
| `POST /organizations` existe | Existant avant 1.1 | ✅ |
| `POST` accepte `businessType` | Story 1.3 | ✅ |
| `POST` accessible via API Key | Story 1.3 (fix guard) | ✅ |

## Couverture AC Story 1.4

| AC | Statut | Artefact |
|----|--------|---------|
| AC#1 — GET retourne `type` si défini | ✅ | `mikro-orm-organization.repository.ts:63` + spec |
| AC#2 — GET retourne `type: null` si absent | ✅ | `row.type ?? null` + spec nouveau cas |
| AC#3 — POST retourne `settings.businessType` | ✅ | Story 1.3 (aucun changement nécessaire) |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/organization/domain/ports/organization.repository.interface.ts` | Modifié | `OrganizationWithRole.type: string \| null` |
| `backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts` | Modifié | `knex.raw("o.settings->>'businessType' as type")` |
| `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.spec.ts` | Modifié | +1 test `null type` + mise à jour fixtures avec `type` |
| `zeroclaw/tools/check-user-exists.tool.yaml` | Modifié | Champ `type` documenté dans response_schema + exemples |

## Dépendances

- **Dépend de** : Story 1.1 (endpoint GET) + Story 1.3 (`businessType` en base)
- **Clôture** : Epic 1 — tous les endpoints backend pour ZeroClaw sont complets
