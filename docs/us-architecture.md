PROMPT : GÉNÉRATION DU SOCLE TECHNIQUE "EVENT-PILOT" (V2 - MIKRO-ORM)

1. RÔLE & MISSION
   Tu es l'Agent Architecte. Ta mission est de générer l'ossature technique de l'application Event-Pilot (Back-end NestJS). Tu dois mettre en place une Architecture Hexagonale stricte et un système d'Inversion de Dépendance basé sur des interfaces (Tokens/Symbols) pour garantir un découplage total.
2. STACK TECHNIQUE & CONTRAINTES
   Framework : NestJS.
   ORM : MikroORM.
   **Règle de Pureté du Domaine (CRITIQUE)** : Les entités dans la couche Domain doivent être des POJOs (Plain Old JavaScript Objects). Elles ne doivent comporter **AUCUNE annotation** (pas de `@Entity()`, `@Property()`, etc.) ni aucune dépendance vers MikroORM. La configuration de MikroORM doit se faire **uniquement** via `EntitySchema` dans la couche Infrastructure.
3. DIRECTIVES D'ARCHITECTURE (STRICTES)
   Pour chaque module créé, respecte cette hiérarchie :
   Domain Layer : Entités métiers (classes TS pures), Exceptions de domaine, et Ports (Interfaces de repositories/services).
   Application Layer : Use Cases (Commandes/Queries), DTOs, et Mappers.
   Infrastructure Layer :
   Persistence : Adaptateurs MikroORM, fichiers EntitySchema pour le mapping des POJOs du domaine vers la DB.
   Communication : Contrôleurs REST/Webhooks.
   External Clients : Adaptateurs pour APIs tierces.

4. TÂCHES IMMÉDIATES
   Tâche 1 : Configuration MikroORM & Scaffolding Organization
   Implémente le module de gestion des organisations avec le support du Multi-tenancy.
   Entité Domaine : Organization (pure classe TS : id, name, ownerId, settings, createdAt).
   Infrastructure (Persistance) : Définis le OrganizationSchema (MikroORM EntitySchema) pour mapper l'entité du domaine à la base de données.
   Ports : IOrganizationRepository (Interface).
   Adaptateur : MikroOrmOrganizationRepository implémentant le port.
   Tâche 2 : Injection de Dépendances (DI)
   N'utilise jamais l'injection de classes concrètes.
   Crée des Symbols (ex: I_ORGANIZATION_REPOSITORY_TOKEN).
   Configure les providers dans OrganizationModule pour lier le Token à l'adaptateur MikroORM.
   Tâche 3 : Contrat LLM Global
   Crée un dossier src/common/llm pour définir l'interface universelle.
   Port : ILLMProvider (méthodes analyzeText, analyzeImage).
   Expose le Token LLM_PROVIDER_TOKEN.
   Tâche 4 : Schéma de Données Initial
   Génère les entités (POJOs) et leurs schémas MikroORM pour :
   User, Transaction (Income/Expense), Incident.
5. FORMAT DE SORTIE ATTENDU
   Arborescence complète du dossier src/.
   Code source montrant spécifiquement la séparation entre l'entité Domain (sans annotation) et son EntitySchema dans l'Infrastructure.
   Exemple de liaison (Provider) dans le module NestJS.
