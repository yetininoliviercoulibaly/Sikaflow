# Matrice de Traçabilité — Story 1.2

| Requirement | AC | Implémentation | Validation |
|-------------|-----|----------------|------------|
| FR1 — Inscription conversationnelle | AC#1, AC#2, AC#3 | `zeroclaw/system-prompt.md` (section onboarding) | Conversation design + exemples |
| AR1 — Communication via ZeroClaw | AC#1–#5 | `zeroclaw/onboarding-conversation.md` | Flow diagram + 4 scénarios |
| NFR1 — Latence < 5s | AC#5 (max 3 Q) | Limite stricte dans system prompt | ≤ 3 exchanges avant create_org |

## Couverture AC

| AC | Statut | Artefact |
|----|--------|---------|
| AC#1 — Q1 = nom business | ✅ | `system-prompt.md:Q1` + `onboarding-conversation.md:Happy Path` |
| AC#2 — Q2 = type + mémorise nom | ✅ | `system-prompt.md:Q2` + `memory-schema.md:onboarding.businessName` |
| AC#3 — infoComplete=true + transition | ✅ | `system-prompt.md:Après Collecte` + `memory-schema.md:onboarding.infoComplete` |
| AC#4 — type invalide → reformulation 1× | ✅ | `system-prompt.md:Q3` + `onboarding-conversation.md:Retry Path` |
| AC#5 — max 3 questions | ✅ | `system-prompt.md:RÈGLE ABSOLUE` + `onboarding-conversation.md:Force Default` |

## Fichiers Modifiés/Créés

| Fichier | Type | Raison |
|---------|------|--------|
| `zeroclaw/system-prompt.md` | Modifié | Section onboarding enrichie avec flux détaillé et mapping |
| `zeroclaw/memory-schema.md` | Créé | Schéma formel des clés mémoire ZeroClaw |
| `zeroclaw/onboarding-conversation.md` | Créé | Design de conversation avec flow, exemples, normalisation |

## Dépendances

- **Dépend de** : Story 1.1 (`check_user_exists` tool + mémoire ZeroClaw)
- **Bloque** : Story 1.3 (`create_organization` tool — référencé dans system prompt)
