# Design de Conversation — Onboarding SikaFlow

Ce document spécifie le flow exact de la conversation d'onboarding pour un nouvel utilisateur.
Il sert de référence pour les tests et la validation du comportement de l'agent.

---

## Diagramme de Flux

```
[Message entrant] ─→ check_user_exists(phone)
                          │
                  ┌───────┴───────┐
               [] vide         [orgs] trouvées
                  │                  │
           MODE ONBOARDING    MODE SESSION NORMALE
                  │
                  ▼
        Q1: "Comment s'appelle ton business ?"
                  │
            [réponse reçue]
                  │
        memory.write(onboarding.businessName)
        memory.write(onboarding.questionCount = 1)
                  │
                  ▼
        Q2: "Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
                  │
            [réponse reçue]
                  │
          ┌───────┴───────────────┐
     type valide?               type invalide
          │                         │
          ▼                     Q3 (reformulation)
   memory.write(businessType)       │
   memory.write(infoComplete=true)  ├─ valide → write(businessType)
          │                         └─ invalide → write(businessType="commerce")
          ▼                                        write(infoComplete=true)
   create_organization(name, businessType, phone)
          │
          ▼
   "🎉 Ton espace [nom] est prêt ! Essaie : 'Dépense 5000 pour les boissons'"
```

---

## Exemples de Conversations

### Happy Path — Maquis

```
👤 User   : "Salut"
🤖 Agent  : "👋 Bienvenue sur SikaFlow ! Comment s'appelle ton business ?"
👤 User   : "Maquis Chez Omar"
🤖 Agent  : "Super ! Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
👤 User   : "maquis"
🤖 Agent  : [appelle create_organization]
             "🎉 Ton espace Maquis Chez Omar est prêt ! Essaie : 'Dépense 5000 pour les boissons'"
```

**Mémoire finale :**
```json
{
  "onboarding": { "businessName": "Maquis Chez Omar", "businessType": "maquis", "infoComplete": true, "questionCount": 2 },
  "session": { "activeOrgId": "uuid-créé", "activeOrgName": "Maquis Chez Omar", "activeOrgRole": "OWNER" }
}
```

---

### Retry Path — Type invalide, suggestion dynamique

L'agent infère le type le plus probable à partir de la réponse brute, puis le propose.

```
👤 User   : "Bonjour"
🤖 Agent  : "👋 Bienvenue sur SikaFlow ! Comment s'appelle ton business ?"
👤 User   : "Festival de Musique Abidjan"
🤖 Agent  : "Super ! Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
👤 User   : "concert de musique"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : événementiel ? (maquis / restaurant / bar / événementiel / commerce)"
               ↑ déduit de "concert de musique" → événementiel
👤 User   : "oui"
🤖 Agent  : [appelle create_organization]
             "🎉 Ton espace Festival de Musique Abidjan est prêt !"
```

```
👤 User   : "boite de nuit"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : bar ? (maquis / restaurant / bar / événementiel / commerce)"
               ↑ déduit de "boite de nuit" → bar
```

```
👤 User   : "traiteur mariage"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : restaurant ? (maquis / restaurant / bar / événementiel / commerce)"
               ↑ déduit de "traiteur" → restaurant
```

---

### Fuzzy Match — Alias reconnu directement

```
👤 User   : "resto"
→ type résolu : "restaurant" (pas de Q3 nécessaire)
```

```
👤 User   : "boutique vêtements"
→ type résolu : "commerce" (fuzzy match sur "boutique")
```

---

### Force Default — Type toujours invalide

```
👤 User   : "je fais du digital marketing"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : événementiel ? (maquis / restaurant / bar / événementiel / commerce)"
👤 User   : "non rien de tout ça"
→ type = "commerce" (défaut, 3e question = max atteint)
🤖 Agent  : [appelle create_organization avec type="commerce"]
             "🎉 Ton espace [nom] est prêt !"
```

---

## Règles de Normalisation des Types

```javascript
function normalizeBusinessType(input) {
  const text = input.toLowerCase().trim();

  if (/maquis|maki|makis/.test(text)) return "maquis";
  if (/restaurant|resto|restau/.test(text)) return "restaurant";
  if (/\bbar\b|boite|boîte|pub/.test(text)) return "bar";
  if (/event|festival|soirée|soiree|spectacle/.test(text)) return "evenementiel";
  if (/commerce|boutique|shop|magasin|vente|épicerie|epicerie/.test(text)) return "commerce";

  return null; // invalide → déclenche reformulation
}
```

---

## Contraintes de l'Agent

| Contrainte | Valeur | Justification |
|-----------|--------|---------------|
| Questions max | 3 | Expérience WhatsApp — éviter la frustration |
| Timeout réponse | N/A | ZeroClaw gère la session, pas de timeout défini |
| Longueur réponse agent | ≤ 2 phrases | Contrainte UX WhatsApp |
| Emojis | ≤ 2 par message | Contrainte Meta (taux de blocage) |
