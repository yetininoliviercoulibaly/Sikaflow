# ZeroClaw Memory Schema — SikaFlow

Ce document définit le schéma officiel des clés de mémoire conversationnelle utilisées par l'agent SikaFlow.
ZeroClaw persiste ces données en PostgreSQL par session utilisateur (identifié par numéro de téléphone ou identifiant Telegram).

---

## Namespace `onboarding`

Utilisé pendant le flux d'inscription d'un nouvel utilisateur.
Effacé / archivé après création réussie de l'organisation.

| Clé | Type | Description | Valeurs possibles |
|-----|------|-------------|------------------|
| `onboarding.businessName` | `string` | Nom du business saisi par l'utilisateur | Texte libre |
| `onboarding.businessType` | `string` | Type d'activité normalisé | `maquis` \| `restaurant` \| `bar` \| `evenementiel` \| `commerce` |
| `onboarding.infoComplete` | `boolean` | Toutes les infos nécessaires sont collectées | `true` \| `false` |
| `onboarding.questionCount` | `number` | Nombre de questions posées (ne doit pas dépasser 3) | 1 \| 2 \| 3 |

### Cycle de vie

```
message_1 → check_user_exists → [] → mode onboarding
message_2 → Q1 (nom)  → onboarding.businessName défini
message_3 → Q2 (type) → onboarding.businessType défini, onboarding.infoComplete = true
           → create_organization appelé → namespace onboarding archivé
```

---

## Namespace `session`

Contexte actif de l'utilisateur (organisation sélectionnée).
Persiste entre les sessions.

| Clé | Type | Description | Valeurs possibles |
|-----|------|-------------|------------------|
| `session.activeOrgId` | `string` | UUID de l'organisation active | UUID v4 |
| `session.activeOrgName` | `string` | Nom de l'organisation active | Texte libre |
| `session.activeOrgRole` | `string` | Rôle de l'utilisateur dans l'org active | `OWNER` \| `MANAGER` \| `STAFF` |
| `session.userPhoneNumber` | `string` | Numéro de téléphone résolu (cache pour éviter re-identification Telegram) | E.164 (ex: `+2250707070405`) |

### Cycle de vie

```
check_user_exists(telegram_user_id) → session.userPhoneNumber résolu depuis la réponse API
create_organization → session.activeOrgId, session.activeOrgName, session.activeOrgRole définis
"Passe sur Festival" → session.activeOrgId mis à jour vers la nouvelle org
```

---

## Namespace `preferences`

Préférences utilisateur persistantes.

| Clé | Type | Description | Défaut |
|-----|------|-------------|--------|
| `preferences.language` | `string` | Langue préférée de l'utilisateur | `fr` |
| `preferences.currency` | `string` | Devise préférée (ISO 4217) | `XOF` |

---

## Règles d'Utilisation

1. **Toujours lire la mémoire avant d'agir** — ne re-demande pas des infos déjà mémorisées
2. **Écrire atomiquement** — toutes les clés d'un namespace mises à jour ensemble
3. **Ne jamais stocker de données sensibles** — pas de mots de passe, tokens, ou données bancaires
4. **`onboarding.*` est temporaire** — effacer ou ignorer après `session.activeOrgId` défini
