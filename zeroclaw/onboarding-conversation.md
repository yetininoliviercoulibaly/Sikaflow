# Design de Conversation — Onboarding SikaFlow

Ce document spécifie le flow de la conversation d'onboarding pour un nouvel utilisateur.
Il sert de référence pour les tests et la validation du comportement de l'agent.

---

## Diagramme de Flux

```
[Message entrant]
        │
        ├─→ check_user_exists(phone)  ← en arrière-plan (n'attend pas avant de répondre)
        │
        ▼
 Répondre normalement au message
        │
        ├─────────────────────────────────────────────────────┐
        │  check_user_exists → [] (nouvel utilisateur)        │  check_user_exists → [orgs]
        │                                                     │  (utilisateur connu)
        ▼                                                     ▼
 Le message est-il une ACTION SikaFlow ?            MODE SESSION NORMALE
 (dépense, revenu, dette, organisation...)
        │
   ┌────┴────┐
  OUI       NON (salutation, question générale, curiosité...)
   │              │
   ▼              ▼
ONBOARDING    Répondre normalement
IMMÉDIAT      + suggérer l'onboarding de façon douce en fin de message
   │              │
   └──────┬───────┘
          │  (si l'utilisateur accepte / demande une action SikaFlow)
          ▼
  Q1: "Comment s'appelle ton business ?"
          │
    [réponse reçue]
          │
  memory.write(onboarding.businessName)
          │
          ▼
  Q2: "Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
          │
    [réponse reçue]
          │
    ┌─────┴──────────────┐
 type valide?         type invalide
    │                     │
    ▼                 Q3: suggestion dynamique du type le plus proche
memory.write              │
(businessType,        ┌───┴───┐
 infoComplete=true)  valide  invalide
    │                  │       │
    │            write(type) write(type="commerce")
    │                  │       │
    └──────────────────┴───────┘
          │
          ▼
  create_organization(name, businessType, phone)
          │
          ▼
  "🎉 Ton espace [nom] est prêt ! Essaie : 'Dépense 5000 pour les boissons'"
```

---

## Scénarios de Conversation

### Scénario 1 — Salutation simple (nouvel utilisateur)

L'agent répond à la salutation naturellement, puis propose l'onboarding sans forcer.

```
👤 User   : "Salut"
🤖 Agent  : "Salut ! 👋 Comment je peux t'aider ? Au fait, si tu as un business à gérer,
              je peux te créer un espace en 2 questions 😊"
👤 User   : "Ah oui c'est quoi exactement ?"
🤖 Agent  : "Je te permets de gérer ta caisse, tes dettes et tes événements par WhatsApp.
              Dis-moi juste le nom de ton business et on démarre !"
👤 User   : "Ok go, c'est Maquis Chez Omar"
🤖 Agent  : "Super ! Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
👤 User   : "maquis"
🤖 Agent  : [appelle create_organization]
             "🎉 Ton espace Maquis Chez Omar est prêt ! Essaie : 'Dépense 5000 pour les boissons'"
```

**Mémoire finale :**
```json
{
  "onboarding": { "businessName": "Maquis Chez Omar", "businessType": "maquis", "infoComplete": true },
  "session": { "activeOrgId": "uuid-créé", "activeOrgName": "Maquis Chez Omar", "activeOrgRole": "OWNER" }
}
```

---

### Scénario 2 — Question générale hors-sujet (nouvel utilisateur)

L'agent répond à la question, puis glisse une suggestion non intrusive.

```
👤 User   : "C'est quoi la capitale du Sénégal ?"
🤖 Agent  : "C'est Dakar 🇸🇳 Au fait, tu as un business ? Je peux te créer un espace de gestion en 2 questions."
👤 User   : "Non merci pour l'instant"
🤖 Agent  : "Pas de souci ! Je suis là si tu as besoin 😊"
```

> L'agent n'insiste pas. Si l'utilisateur revient plus tard avec une action SikaFlow,
> l'onboarding se déclenche à ce moment-là.

---

### Scénario 3 — Action SikaFlow directe (nouvel utilisateur)

Le message de l'utilisateur est clairement une intention SikaFlow → onboarding immédiat.

```
👤 User   : "Je veux enregistrer une dépense de 15000 FCFA"
🤖 Agent  : "👋 Je vois que tu veux gérer tes finances — super ! Commençons par créer ton espace.
              Comment s'appelle ton business ?"
👤 User   : "Festival Abidjan 2026"
🤖 Agent  : "Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
👤 User   : "événementiel"
🤖 Agent  : [appelle create_organization]
             "🎉 Ton espace Festival Abidjan 2026 est prêt ! Je reviens à ta dépense :
              tu disais 15 000 FCFA — pour quoi ?"
```

> L'agent mémorise l'intention initiale et y revient après l'onboarding.

---

### Scénario 4 — Type invalide, suggestion dynamique

L'agent infère le type le plus probable et le propose (pas de valeur figée).

```
👤 User   : "concert de musique"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : événementiel ?
              (maquis / restaurant / bar / événementiel / commerce)"
              ↑ déduit de "concert de musique" → événementiel

👤 User   : "boite de nuit"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : bar ?
              (maquis / restaurant / bar / événementiel / commerce)"
              ↑ déduit de "boite de nuit" → bar

👤 User   : "traiteur mariage"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : restaurant ?
              (maquis / restaurant / bar / événementiel / commerce)"
              ↑ déduit de "traiteur" → restaurant
```

---

### Scénario 5 — Fuzzy match direct (pas de Q3)

```
👤 User   : "resto"          → type résolu : "restaurant"  (pas de Q3)
👤 User   : "boutique vêts"  → type résolu : "commerce"    (pas de Q3)
👤 User   : "makis"          → type résolu : "maquis"      (pas de Q3)
```

---

### Scénario 6 — Type définitivement invalide (force default)

```
👤 User   : "je fais du digital marketing"
🤖 Agent  : "Je n'ai pas reconnu ce type. Tu veux dire : commerce ?
              (maquis / restaurant / bar / événementiel / commerce)"
              ↑ meilleure inférence pour "digital marketing"
👤 User   : "non c'est rien de tout ça"
→ type = "commerce" (défaut, 3e question atteinte — on ne pose plus rien)
🤖 Agent  : [appelle create_organization avec type="commerce"]
             "🎉 Ton espace est prêt ! Tu pourras préciser ton activité dans les paramètres."
```

---

### Scénario 7 — Conversation mixte (hors-sujet puis SikaFlow)

```
👤 User   : "Tu connais un bon restaurant à Abidjan ?"
🤖 Agent  : "Je ne suis pas expert des adresses locales 😄 Mais si tu tiens toi-même un resto,
              je peux t'aider à gérer ta caisse !"
👤 User   : "Haha oui j'ai un resto justement"
🤖 Agent  : "Super ! Comment il s'appelle ?"
              ↑ l'agent démarre l'onboarding naturellement, sans reformuler les questions formelles
👤 User   : "Chez Adjoua"
🤖 Agent  : "Quel type d'activité ? maquis / restaurant / bar / événementiel / commerce"
👤 User   : "restaurant"
🤖 Agent  : [appelle create_organization]
             "🎉 Ton espace Chez Adjoua est prêt !"
```

> L'agent peut intégrer la Q1 (nom du business) dans le fil de conversation
> si l'utilisateur l'a déjà donné naturellement — il ne la repose pas.

---

## Règles de Normalisation des Types

```javascript
function normalizeBusinessType(input) {
  const text = input.toLowerCase().trim();

  if (/maquis|maki|makis/.test(text)) return "maquis";
  if (/restaurant|resto|restau|traiteur/.test(text)) return "restaurant";
  if (/\bbar\b|boite|boîte|pub|night/.test(text)) return "bar";
  if (/event|festival|soirée|soiree|spectacle|concert|show/.test(text)) return "evenementiel";
  if (/commerce|boutique|shop|magasin|vente|épicerie|epicerie|digital|service/.test(text)) return "commerce";

  return null; // invalide → déclenche reformulation avec suggestion LLM
}
```

---

## Contraintes de l'Agent

| Contrainte | Valeur | Justification |
|-----------|--------|---------------|
| Questions onboarding max | 3 | Expérience WhatsApp — ne pas frustrer |
| Insistance sur l'onboarding | 0 | Ne jamais forcer si l'utilisateur refuse |
| Sujets hors-SikaFlow | Autorisés | Assistant conversationnel ouvert |
| Suggestion onboarding | 1× par session si refus | Pas de répétition intrusive |
| Longueur réponse agent | ≤ 3 phrases | Contrainte UX WhatsApp |
| Emojis | ≤ 2 par message | Contrainte Meta (taux de blocage) |
