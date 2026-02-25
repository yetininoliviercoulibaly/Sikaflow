# Matrice de Traçabilité — Story 1.3

| Requirement | AC | Implémentation | Test |
|-------------|-----|----------------|------|
| FR1 — Inscription conversationnelle (création org) | AC#1, AC#3 | `CreateOrganizationUseCase` + `POST /organizations` + `create-organization.tool.yaml` | `create-organization.use-case.spec.ts` |
| FR2 — Création automatique d'organisation | AC#1, AC#2 | Bug fix `@Roles(ADMIN)` + `businessType` dans settings | Tests unitaires nouveaux cas |
| AR1 — Communication via ZeroClaw | AC#3 | `zeroclaw/tools/create-organization.tool.yaml` (post_actions mémoire + message) | — |
| AR2 — Backend REST API pure | AC#1, AC#2, AC#4 | `POST /organizations` sans restriction de rôle | Rétrocompatibilité vérifiée |

## Couverture AC

| AC | Statut | Artefact |
|----|--------|---------|
| AC#1 — `businessType` persisté dans `settings` | ✅ | `create-organization.use-case.ts:57-60` + spec:test businessType |
| AC#2 — API Key acceptée (sans ADMIN role) | ✅ | `organization.controller.ts` — `@Roles` supprimé |
| AC#3 — Mémoire session.* + message confirmation | ✅ | `create-organization.tool.yaml:post_actions` |
| AC#4 — `businessType` absent → pas d'erreur | ✅ | `@IsOptional()` DTO + spec:test sans businessType |

## Bug corrigé

| Bug | Localisation | Fix |
|-----|-------------|-----|
| `@Roles(UserRole.ADMIN)` bloque ZeroClaw API Key | `organization.controller.ts:40` | Decorator supprimé — `CompositeAuthGuard` suffit |

## Fichiers Modifiés

| Fichier | Type | Raison |
|---------|------|--------|
| `backend/src/organization/application/dtos/organization.dtos.ts` | Modifié | +`businessType?: string` avec `@IsOptional()` |
| `backend/src/organization/application/use-cases/create-organization.use-case.ts` | Modifié | +`businessType` command + `settings.businessType` conditionnel |
| `backend/src/organization/application/use-cases/create-organization.use-case.spec.ts` | Modifié | +2 tests : avec/sans `businessType` |
| `backend/src/organization/application/controllers/organization.controller.ts` | Modifié | Suppression `@Roles(ADMIN)` + nettoyage imports |
| `zeroclaw/tools/create-organization.tool.yaml` | Créé | Tool HTTP POST + post_actions mémoire session.* |

## Dépendances

- **Dépend de** : Story 1.1 (`check_user_exists`) + Story 1.2 (`onboarding.businessName/Type` en mémoire)
- **Complète** : Epic 1 côté ZeroClaw (onboarding bout-en-bout)
- **Ouvre** : Epic 2 (gestion de caisse — l'utilisateur a maintenant une org active)
