---
description: Développement backend Event-Pilot - Charge les règles d'architecture et coding standards
---

# Backend Development Workflow

Ce workflow charge les règles d'architecture et de codage pour le développement du backend Event-Pilot (NestJS).

## Règles à Consulter

Avant toute modification du backend, consulter obligatoirement :

1. **Architecture Rules** : `backend/docs/backend-architecture-rules.md`
   - Architecture hexagonale par module
   - Injection de dépendances via interfaces (Tokens)
   - MikroORM sans annotations dans le domaine

## Checklist Pré-Développement

- [ ] Lire les règles d'architecture
- [ ] Identifier le module concerné (auth, ticketing, feedback, etc.)
- [ ] Vérifier la structure hexagonale (domain/application/infrastructure)

## Structure Module Type

```
src/{module-name}/
├── domain/
│   ├── entities/
│   ├── ports/
│   └── services/
├── application/
│   ├── use-cases/
│   ├── dtos/
│   └── use-cases/
└── infrastructure/
    ├── persistence/
    ├── web/
    └── adapters/
```

## Commandes Utiles (Backend)

> **Note**: Exécuter les commandes depuis le dossier `backend/`

// turbo

```bash
cd backend && npm run build
```

// turbo

```bash
cd backend && npm run test
```
