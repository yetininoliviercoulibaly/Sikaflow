# ATDD — Story 1.2: Collecte d'Informations Business

## Matrice de Test

| AC | Type | Scénario | Résultat Attendu |
|----|------|----------|-----------------|
| AC#1 | Conversation | Onboarding mode → Q1 = nom business | Agent pose "Comment s'appelle ton business ?" |
| AC#2 | Conversation | Réponse nom → Q2 = type activité | Présente les 5 options valides, mémorise nom |
| AC#3 | Conversation | Réponse type valide → infoComplete=true | Mémoire correctement peuplée, transition vers création |
| AC#4 | Conversation | Type invalide → reformulation | Question reformulée 1× avec options, fuzzy match |
| AC#5 | Conversation | Comptage questions | Max 3 questions, jamais plus |

## Scénarios de Conversation (Contrats)

### Happy Path (2 questions)
```
Agent  : "👋 Bienvenue sur SikaFlow ! Comment s'appelle ton business ?"
User   : "Maquis Chez Omar"
Agent  : "Super ! Quel type d'activité ? (maquis / restaurant / bar / événementiel / commerce)"
User   : "maquis"
→ Memory: { businessName: "Maquis Chez Omar", businessType: "maquis", infoComplete: true }
→ Transition: Story 1.3 (création organisation)
```

### Retry Path (3 questions max)
```
Agent  : "👋 Bienvenue sur SikaFlow ! Comment s'appelle ton business ?"
User   : "Festival Abidjan"
Agent  : "Quel type d'activité ? (maquis / restaurant / bar / événementiel / commerce)"
User   : "event de musique"
Agent  : "Je n'ai pas compris. Tu veux dire : événementiel ? (maquis / restaurant / bar / événementiel / commerce)"
User   : "oui événementiel"
→ Memory: { businessName: "Festival Abidjan", businessType: "evenementiel", infoComplete: true }
```

### Fuzzy Match Path
```
User   : "resto"  → type = "restaurant"
User   : "makis"  → type = "maquis"
User   : "boutique" → type = "commerce"
```

### Force Default (type toujours invalide après reformulation)
```
→ Memory: { businessType: "commerce" }  // fallback
```

## Contrats Mémoire

```json
{
  "onboarding": {
    "businessName": "string — nom saisi par l'utilisateur",
    "businessType": "string — valeur canonique (maquis|restaurant|bar|evenementiel|commerce)",
    "infoComplete": "boolean — true quand les deux champs sont collectés"
  }
}
```

## Critères d'Acceptance Technique

- [ ] System prompt définit exactement 2 questions (pas 3 d'emblée)
- [ ] Types valides documentés avec aliases
- [ ] Règle ≤3 questions explicite dans le prompt
- [ ] Schéma mémoire formellement défini dans `memory-schema.md`
- [ ] Exemples de conversation couvrant happy path + retry
