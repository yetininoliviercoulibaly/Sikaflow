# Jules-Orchestrator : Architecture & Design

## 1. Architecture Technique

L'objectif est de passer d'un simple script CI "stateless" (comme l'actuel `gemini-ci.yml`) à une orchestration de sessions persistantes et contextuelles via Google Antigravity.

### Le Rôle du Protocole MCP (Model Context Protocol)
Le MCP est le pivot de cette architecture. Plutôt que de cloner le repo dans l'environnement du LLM (risqué et lent) ou de copier-coller des diffs (perte de contexte global), nous utiliserons une architecture **MCP Tunneling**.

1.  **CI Runner (Github Actions/Gitlab CI)** :
    *   Clone le code frais.
    *   Lance un **MCP Server** local (ex: `git-mcp-server` ou `filesystem-mcp-server`).
    *   Ce serveur expose le système de fichiers et l'historique Git en "Read-Only".

2.  **Jules Remote (Antigravity)** :
    *   L'instance Jules tourne dans le cloud Google Antigravity.
    *   Elle se connecte au MCP Server du CI via un tunnel sécurisé (chiffré).
    *   Cela donne à Jules un accès "live" au code tel qu'il est dans la CI, sans avoir besoin de crédentials SSH permanents.

### La Commande `jules remote new` (Stateless Wrapper)

Le CLI Orchestrator servira de pont. Voici la structure proposée pour la commande :

```bash
# Dans le pipeline CI
jules orchestrate \
  --trigger="git-push" \
  --context-tunnel="wss://ci-tunnel.internal/session-123" \
  --personas="qa-engineer,tech-lead" \
  --report-format="pr-comment"
```

**Architecture du Flux de Données :**

```mermaid
graph TD
    A[Développeur Push] --> B[CI Runner]
    B --> C{Orchestrator CLI}
    C -->|Start Tunnel| D[MCP Server Local]
    C -->|API Request| E[Google Antigravity API]
    E -->|Spawn| F[Jules Instance A (QA)]
    E -->|Spawn| G[Jules Instance B (Lead)]
    F <-->|MCP Protocol| D
    G <-->|MCP Protocol| D
    F -->|Report| H[Antigravity Dashboard]
    G -->|Report| H
    H -->|Consolidated JSON| C
    C -->|Post Comment| I[Git Provider API (ou GitHub MCP)]
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
*   **Tunneling** : Ngrok (MVP) ou Cloudflare Tunnel (Prod) pour exposer le MCP local.
*   **Authentification** : Service Account Google Cloud (JSON key) injecté en secret CI.

### Roadmap

**Phase 1 : Le "Connector" (Semaine 1)**
*   Créer le CLI `jules-orchestrator`.
*   Implémenter la logique `git diff` -> `context bundle`.
*   Connecter l'API Antigravity (mockée si besoin au début).
*   Output : Simple log dans la console CI.

**Phase 2 : L'Intégration MCP (Semaine 2)**
*   Configurer un serveur MCP "Filesystem" simple dans le CLI (Read-Only).
*   Configurer un serveur MCP "GitHub" (Write) pour permettre à Jules de commenter directement.
*   Tester la lecture du code par Jules via le tunnel.

**Phase 3 : Le Reporter GitHub (Semaine 3)**
*   Validation des permissions du token GitHub.
*   Logique de consolidation (Fusionner le rapport QA et le rapport Tech Lead).
*   Implémentation du "Post Comment" via l'outil MCP ou API fallback.

**Phase 4 : Les "Special Ops" (Semaine 4+)**
*   Ajout du module "Auto-Fix".
*   Implémentation du scénario "Doc-Keeper".
