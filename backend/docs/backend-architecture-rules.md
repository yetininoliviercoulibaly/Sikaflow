# Backend Architecture Rules (NestJS)

## 1. Vision & Architecture

L'application SikaFlow suit une **Architecture Hexagonale stricte** avec une **Inversion de Dépendance** basée sur des interfaces (Tokens/Symbols) pour garantir un découplage total.

## 2. Stack Technique

- **Framework** : NestJS.
- **ORM** : MikroORM.

## 3. Règles Fondamentales

### Pureté du Domaine (CRITIQUE)

- Les entités dans la couche **Domain** doivent être des **POJOs** (Plain Old JavaScript Objects).
- **INTERDIT** : Aucune annotation (`@Entity()`, `@Property()`, etc.) dans le domaine.
- **INTERDIT** : Aucune dépendance vers MikroORM dans le domaine.
- La configuration de la persistence se fait **uniquement** via `EntitySchema` dans la couche **Infrastructure**.

### Inversion de Dépendance

- **Jamais** d'injection de classes concrètes (Repositories, Services externes).
- Toujours utiliser des **Interfaces** (Ports) définies dans le Domaine.
- Créer des **Symboles/Tokens** pour l'injection (ex: `I_ORGANIZATION_REPOSITORY`).
- Lier l'implémentation (Infrastructure) à l'interface via des `providers` dans les Modules NestJS.

## 4. Structure des Modules

Chaque module doit respecter strictement cette hiérarchie :

```
src/{module-name}/
├── domain/
│   ├── {entity}.entity.ts       # Classe pure
│   ├── ports/                   # Interfaces (Repositories, Services)
│   └── exceptions/              # Exceptions métier
├── application/
│   ├── use-cases/               # Logique applicative
│   ├── dtos/                    # Data Transfer Objects
│   └── handlers/                # Command/Query Handlers
└── infrastructure/
    ├── persistence/             # Implémentations MikroORM & Schemas
    ├── web/                     # Controllers NestJS
    └── adapters/                # Services externes (Stripe, WhatsApp...)
```
