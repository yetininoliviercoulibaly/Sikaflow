# Code Review - PR #112

**Titre :** Refactor Webhook & Agent Integration
**Auteur :** (Développeur)
**Reviewer :** Jules (Tech Lead)

## 📝 Résumé
Cette PR introduit des changements majeurs :
1.  **Refonte du Module Webhook** : Passage d'une architecture basée sur des Stratégies (Text/Image/Audio) à une architecture basée sur des UseCases par plateforme (`ProcessWhatsapp`, `ProcessTelegram`) et des Services partagés (`IntentResolver`, `MessageExtraction`).
2.  **Module Agent** : Introduction d'un agent LangGraph (`AgentOrchestratorService`) avec une suite d'outils (`tools/`).
3.  **Unified Messaging** : Tentative d'unification du traitement des messages via des Parsers.

Globalement, l'architecture va dans le bon sens (Clean Architecture, séparation des responsabilités), mais il reste des dettes techniques et des incohérences de nommage critiques à régler avant le merge.

---

## 🛑 Bloquants / Issues Critiques

### 1. Confusion Architecturale : Telegram dépend de WhatsApp
Dans `ProcessTelegramMessageUseCase`, vous injectez et utilisez `ProcessWhatsappMessageUseCase`.
```typescript
// backend/src/webhook/application/use-cases/process-telegram-message.use-case.ts
constructor(
    // ...
    private readonly processWhatsappMessageUseCase: ProcessWhatsappMessageUseCase,
) {}

async execute(update: TelegramUpdateDto): Promise<void> {
    // ...
    await this.processWhatsappMessageUseCase.execute(unifiedMessage, this.telegramMessagingAdapter);
}
```
**Problème :** Cela crée un couplage fort et illogique. Pourquoi le traitement Telegram passerait-il par un cas d'utilisation nommé "WhatsApp" ?
**Correction requise :** Renommez `ProcessWhatsappMessageUseCase` en `ProcessUnifiedMessageUseCase` (ou `ProcessGenericMessageUseCase`) puisqu'il semble contenir la logique métier agnostique (Agent, LLM, Actions), ou extrayez cette logique commune dans un service dédié.

### 2. Typage `any` dans `MediaStandardizationService`
```typescript
// backend/src/webhook/application/services/media-standardization.service.ts
async transcribeAudio(
    fileId: string,
    type: MessageType.VOICE | MessageType.AUDIO,
    messagingService: any // <--- INTERDIT
): Promise<string | null>
```
**Problème :** Violation des règles TypeScript strictes.
**Correction requise :** Utilisez l'interface `IMessagingService` qui devrait exposer `downloadMedia`. Si l'interface ne l'expose pas, mettez-la à jour.

### 3. Imports dynamiques (`require`) et `@ts-ignore`
Dans `AgentOrchestratorService` et `BaseTool` :
```typescript
// backend/src/agent/agent-orchestrator.service.ts
// @ts-ignore
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
```
**Problème :** Cela indique un problème de configuration de build (ESM vs CJS). Bien que cela puisse être un contournement temporaire pour LangChain, cela rend le code fragile et non type-safe.
**Correction requise :** Essayez de fixer la configuration `tsconfig` ou Jest pour supporter les imports ESM de LangChain, ou isolez ces imports "sales" dans un Adapter infrastructurel dédié pour ne pas polluer le Service du Domaine/Application.

---

## ⚠️ Améliorations Importantes

### 1. Structure du Module Agent
La classe `AgentOrchestratorService` contient la logique d'initialisation de l'agent LangGraph directement dans `onModuleInit`.
**Suggestion :** Pour respecter l'architecture hexagonale, la définition du graphe de l'agent devrait idéalement être dans `infrastructure/agent/langchain-agent.adapter.ts` et implémenter une interface `IAgentService` du domaine. Le service `AgentOrchestratorService` ne ferait qu'appeler cette interface.

### 2. `BaseTool` et l'héritage conditionnel
```typescript
// backend/src/agent/tools/base.tool.ts
try {
    const { StructuredTool } = require('@langchain/core/tools');
    if (StructuredTool) BaseParent = StructuredTool;
}
```
C'est un hack risqué. Si `StructuredTool` ne charge pas, vos outils n'héritent de rien, ce qui cassera surement l'agent au runtime. Assurez-vous que c'est robuste.

### 3. Fichier de test inutile
Le fichier `backend/src/agent/dummy.spec.ts` doit être supprimé.

---

## 🔍 Nitpicks & Détails

*   **`backend/package.json`** : Vous avez ajouté `"ts-jest": "^29.4.6"`. Vérifiez cette version, la dernière stable est souvent `29.1.x` ou `29.2.x`. Une version inexistante peut causer des erreurs d'installation.
*   **Logs** : Beaucoup de `console.log` ou `this.logger.log` avec des données potentiellement sensibles (contenu des messages). Assurez-vous de ne pas logger de PII (Personal Identifiable Information) en production.

---

## ✅ Actions pour le développeur
1.  **Renommer/Refactorer** `ProcessWhatsappMessageUseCase` pour refléter son rôle générique.
2.  Typer correctement `messagingService`.
3.  Supprimer `dummy.spec.ts`.
4.  Vérifier la version de `ts-jest`.

En attente des corrections pour validation finale.
