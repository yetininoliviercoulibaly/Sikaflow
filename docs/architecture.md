# Architecture Technique Globale - EventPilot

## Vue d'Ensemble

EventPilot est une application construite sur **NestJS** suivant une **Architecture Hexagonale (Ports & Adapters)** stricte. Elle utilise une approche événementielle asynchrone pour le traitement des messages WhatsApp.

## Diagramme des Flux (Sequence & Components)

```mermaid
graph TD
    %% Actors
    Staff[Event Staff (WhatsApp)]
    Admin[Admin (Web)]

    %% External Systems
    WA_API[WhatsApp Cloud API]
    Gemini[Google Gemini AI]

    %% Application Boundary
    subgraph "Event Pilot Backend (NestJS)"

        %% Entry Points
        WebhookController[WhatsApp Controller]

        %% Queues
        subgraph "Async Layer (BullMQ + Redis)"
            JobQueue[Queue: 'whatsapp']
            ReportQueue[Queue: 'reports']
        end

        %% Processing Layer
        subgraph "Application Core"
            MsgProcessor[Message Processor]

            %% Strategies
            subgraph "Message Strategies"
                TextStrat[Text Strategy]
                ImgStrat[Image Strategy]
                DocStrat[Document Strategy]
            end

            %% Handlers
            subgraph "Action Handlers"
                TxHandler[Create Transaction Handler]
                ReportHandler[Generate Report Handler]
                InfoHandler[Ask Data Handler]
            end

            %% Domain Services
            TxUseCase[Create Transaction UseCase]
            ReportService[Report Service]
            WAService[WhatsApp Service]
        end

        %% Persistence
        subgraph "Infrastructure"
            Postgres[(PostgreSQL)]
            PromptRepo[Prompt Repository]
            TxRepo[Transaction Repository]
        end
    end

    %% Flows
    Staff -->|Send Message/Photo| WA_API
    WA_API -->|Webhook POST| WebhookController
    WebhookController -->|Add Job| JobQueue

    JobQueue -->|Process Job| MsgProcessor

    %% Strategy Routing
    MsgProcessor -->|Route by Type| TextStrat
    MsgProcessor -->|Route by Type| ImgStrat
    MsgProcessor -->|Route by Type| DocStrat

    %% Handling
    TextStrat -->|Get Prompt| PromptRepo
    TextStrat -->|Analyze Text| Gemini

    ImgStrat -->|Download Media| WAService
    DocStrat -->|Download Media| WAService
    WAService -->|Get Media URL/Blob| WA_API
    ImgStrat -->|Analyze Media| Gemini
    DocStrat -->|Analyze Media| Gemini

    %% Actions
    TextStrat -->|Result Actions| TxHandler
    ImgStrat -->|Result Actions| TxHandler
    DocStrat -->|Result Actions| TxHandler

    TxHandler -->|Execute| TxUseCase
    TxUseCase -->|Persist| Postgres
    TxUseCase -->|Notify User| WAService

    %% Report Flow
    MsgProcessor -->|Intent: Generate Report| ReportHandler
    ReportHandler -->|Add Job| ReportQueue
    ReportQueue -->|Process PDF| ReportService
    ReportService -->|Fetch Data| Postgres
    ReportService -->|Send PDF| WAService

    WAService -->|Reply| WA_API
```

## Composants Clés

### 1. Webhook & File d'Attente (Ingress)

- **WhatsAppController** : Reçoit les payloads bruts de Meta. Valide la signature et met le message en file d'attente (`whatsapp`).
- **Objectif** : Répondre instantanément (200 OK) à WhatsApp pour éviter les timeouts, et lisser la charge.

### 2. Processeur de Messages & Stratégies

- **MessageProcessor** : Consomme la file d'attente.
- **Stratégies** : Le pattern Strategy est utilisé pour router le traitement selon le type de contenu :
  - `TextMessageStrategy` : Récupère le prompt dynamique en base et appelle `analyzeText`.
  - `ImageMessageStrategy` / `DocumentMessageStrategy` : Télécharge le média via `WhatsAppService` puis appelle `analyzeMedia` (Gemini Multimodal).

### 3. LLM Provider (Google Gemini)

- Interface `ILLMProvider` abstraite.
- `GeminiLLMProvider` implémente :
  - `analyzeText` : Analyse d'intents multiples (Transaction, Incident, Rapport...).
  - `analyzeMedia` : Analyse visuelle des factures ou incidents (via `inlineData`).

### 4. Action Handlers (Chain of Responsibility)

- Le résultat de l'IA est une liste d'Actions (`CREATE_TRANSACTION`, `GENERATE_REPORT`).
- `ProcessMessageUseCase` itère sur ces actions et délègue au Handler approprié (`IActionHandler`).

### 5. Persistance & Infrastructure

- **PostgreSQL** : Base de données relationnelle.
- **MikroORM** : Mappe les entités du Domaine sans les polluer (Schema-based).
- **PromptRepository** : Permet de modifier les prompts système sans redéployer le code.
