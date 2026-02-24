# Matrice de Traçabilité — Story 1.1

| Requirement | AC | Implémentation | Test |
|-------------|-----|----------------|------|
| FR1 — Inscription conversationnelle | AC#1, AC#2 | `GetOrganizationsByPhoneUseCase` + `GET /organizations?phoneNumber=` + `zeroclaw/system-prompt.md` | `get-organizations-by-phone.use-case.spec.ts` |
| AR1 — Communication via ZeroClaw | AC#1 | `zeroclaw/tools/check-user-exists.tool.yaml` | — |
| AR2 — Backend REST API pure | AC#3, AC#4 | `OrganizationController.getByPhone()` | Contrat API documenté ATDD |
| NFR1 — Latence < 5s | AC#1 | SQL JOIN unique (pas N+1) | — |

## Couverture AC

| AC | Statut | Fichier |
|----|--------|---------|
| AC#1 — Retourne `[]` si inconnu | ✅ | `get-organizations-by-phone.use-case.spec.ts:15` |
| AC#2 — Retourne orgs+rôle si connu | ✅ | `get-organizations-by-phone.use-case.spec.ts:25` |
| AC#3 — 200 OK avec `[]` (pas 404) | ✅ | Use case retourne `[]` sans throw |
| AC#4 — 200 OK avec liste si connu | ✅ | `get-organizations-by-phone.use-case.spec.ts:36` |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/organization/domain/ports/organization.repository.interface.ts` | Modifié | +`findByPhoneNumber` + `OrganizationWithRole` interface |
| `backend/src/organization/infrastructure/persistence/mikro-orm-organization.repository.ts` | Modifié | Implémentation SQL JOIN |
| `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.ts` | Créé | Use case métier |
| `backend/src/organization/application/use-cases/get-organizations-by-phone.use-case.spec.ts` | Créé | Tests unitaires (3 cas) |
| `backend/src/organization/application/controllers/organization.controller.ts` | Modifié | +endpoint `GET /organizations?phoneNumber=` |
| `backend/src/organization/organization.module.ts` | Modifié | Enregistrement `GetOrganizationsByPhoneUseCase` |
| `zeroclaw/system-prompt.md` | Créé | Logique détection nouvel utilisateur |
| `zeroclaw/tools/check-user-exists.tool.yaml` | Créé | Tool HTTP ZeroClaw |
