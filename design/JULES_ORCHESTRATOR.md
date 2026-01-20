# Jules-Orchestrator : Architecture & Design

## 1. Architecture Technique

L'objectif est de passer d'un simple script CI "stateless" (comme l'actuel `gemini-ci.yml`) à une orchestration de sessions persistantes et contextuelles via Google Antigravity.

### Le Rôle du Protocole MCP (Model Context Protocol)
Le MCP est le pivot de cette architecture. Plutôt que de cloner le repo dans l'environnement du LLM (risqué et lent) ou de copier-coller des diffs (perte de contexte global), nous utiliserons une architecture flexible : **Local First** pour le développement, et **MCP Tunneling** pour la CI.

#### Mode Local (MVP & Dev)
Pour démarrer, nous adoptons une approche "Local First". Le développeur lance l'orchestrateur directement sur sa machine.

1.  **Environment Local** :
    *   Le développeur a configuré un **serveur MCP local** (ex: `filesystem-mcp-server`) qui expose son dossier de travail actuel.
    *   Il exécute `jules orchestrate --local`.

2.  **Jules Agent (Client)** :
    *   Le CLI Orchestrator se connecte directement au serveur MCP local (via stdio ou localhost).
    *   Il transmet les requêtes contextuelles ("Lis le fichier X", "Donne moi le diff") au serveur MCP local.
    *   Il communique avec l'API Google Antigravity pour le raisonnement (le "cerveau"), en lui fournissant le contexte récupéré localement.

#### Mode CI (Cible)
Dans un second temps, pour l'intégration continue :

1.  **CI Runner** : Clone le code et lance le serveur MCP.
2.  **Tunnel** : Un tunnel sécurisé (Ngrok/Cloudflare) expose ce serveur MCP.
3.  **Jules Remote** : L'instance cloud se connecte au tunnel pour accéder au contexte.

### La Commande `jules orchestrate`

Le CLI unifie les deux mondes.

```bash
# Mode Local (MVP)
jules orchestrate --local --personas="qa,tech-lead"

# Mode CI (Cible)
jules orchestrate \
  --trigger="git-push" \
  --context-tunnel="wss://ci-tunnel.internal/session-123"
```

**Architecture du Flux de Données (Local/MVP) :**

```mermaid
graph TD
    A[Développeur] -->|Lance| C{Orchestrator CLI}
    C <-->|MCP Protocol (Stdio)| D[MCP Server Local]
    D -->|Read Context| Files[Fichiers Locaux]
    C -->|API Request + Context| E[Google Antigravity API]
    E -->|Reasoning| C
    C -->|Report| A[Console / Log]
```

## 2. Scénarios Avancés (Brainstorming)

Au-delà de la QA et de la Revue de Code, Jules peut intervenir sur la maintenance proactive.

### Scénario 3 : Le "Doc-Keeper" (Mise à jour de Documentation)
*   **Trigger** : Modification de fichiers `.ts` contenant des décorateurs API (NestJS) ou des types GraphQL.
*   **Action** : Jules analyse le delta entre le code et la documentation (`README.md`, `SWAGGER`, fichiers `.mdx`).
*   **Output** : Si une divergence est détectée (ex: nouveau champ requis non documenté), Jules propose un commit direct sur la branche de PR avec la mise à jour de la doc.
*   **Prompt Spécial** : "Tu es un Technical Writer. Analyse ce changement de code et mets à jour le paragraphe correspondant dans `/docs`."

### Scénario 4 : Le "Sentinel" (Analyse d'Impact Sécurité & Dépendances)
*   **Trigger** : Modification de `package.json`, `docker-compose.yml` ou fichiers d'infra.
*   **Action** :
    1.  Vérifie les CVEs des nouvelles libs ajoutées.
    2.  Analyse la configuration Docker pour les mauvaises pratiques (ex: root user).
    3.  Vérifie si des secrets sont hardcodés dans le diff.
*   **Output** : Bloque le merge immédiatement si une faille critique (High/Critical) est détectée.

### Scénario 5 : L'"Architecte Visuel" (Génération de Diagrammes)
*   **Trigger** : Changements majeurs dans la structure des dossiers ou les relations entre modules.
*   **Action** : Jules utilise le MCP pour lire l'arborescence complète et génère un diagramme Mermaid mis à jour du système.
*   **Output** : Met à jour le fichier `ARCHITECTURE.md` avec le nouveau graphe des dépendances. "Je vois que tu as ajouté un module `Notification`, voici le diagramme de séquence mis à jour."

## 3. Workflow de Communication

La gestion des retours doit être nuancée pour ne pas fatiguer les développeurs ("Alert Fatigue").

### Matrice de Décision

| Gravité | Type | Action de Jules | Exemple |
| :--- | :--- | :--- | :--- |
| **Critique** | Sécurité, Build Break | **Bloquer le Merge** + Commentaire Rouge | Secret commité, boucle infinie détectée |
| **Majeur** | Bug Fonctionnel, Architecture | Commentaire "Request Changes" | Logique métier inversée, violation DDD |
| **Mineur** | Optimisation, Typos | Commentaire "Comment" (Non bloquant) | Variable mal nommée, complexité O(n^2) évitable |
| **Trivial** | Formatage, Doc manquante | **Auto-Fix (Commit)** | Lint fix, ajout JSDoc manquant |

### Auto-Correction (Self-Healing)
Si Jules est confiant à >95% (ex: un import manquant ou une syntaxe invalide détectée par le linter mais fixable), il ne doit pas commenter. Il doit :
1.  Générer le patch.
2.  Pusher le commit `style: auto-fix by jules`.
3.  Notifier : "J'ai corrigé quelques erreurs de style pour toi."

## 4. Plan de Build (MVP)

### Stack Technique
*   **CLI Orchestrator** : Node.js (TypeScript). Facile à intégrer dans l'écosystème actuel.
*   **MCP Local** : `@modelcontextprotocol/server-filesystem` (Standard).
*   **Authentification** : Clé API Google Antigravity (Env Var locale).

### Roadmap

**Phase 1 : Le "Local Pilot" (Semaine 1)**
*   Objectif : Faire tourner Jules sur le poste du développeur.
*   Créer le CLI `jules-orchestrator` avec support du flag `--local`.
*   Connecter le CLI au serveur MCP local (via configuration JSON ou autodetect).
*   Tester le flux : Le CLI lit un fichier via MCP -> Envoie à Antigravity -> Reçoit la réponse.

**Phase 2 : L'Intégration Git & Github (Semaine 2)**
*   Ajouter le support d'un serveur MCP Git (pour lire l'historique/diff local).
*   Connecter un serveur MCP "GitHub" (Write) pour permettre à Jules de commenter (même depuis le local).
*   Valider le scénario "Code Review" complet en local.

**Phase 3 : Le Tunneling CI (Semaine 3)**
*   Transition vers l'architecture distante.
*   Mise en place du tunnel (Ngrok/Cloudflare) dans le script CI.
*   Adaptation du CLI pour accepter `--context-tunnel`.

**Phase 4 : Les "Special Ops" (Semaine 4+)**
*   Ajout du module "Auto-Fix".
*   Implémentation du scénario "Doc-Keeper".
