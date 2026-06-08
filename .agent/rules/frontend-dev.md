---
description: Développement frontend SikaFlow - Charge les règles d'architecture et coding standards
---

# Frontend Development Workflow

Ce workflow charge les règles d'architecture et de codage pour le développement du frontend SikaFlow (Next.js).

## Règles à Consulter

Avant toute modification du frontend, consulter obligatoirement :

1. **Architecture Rules** : `frontend/docs/frontend-architecture-rules.md`

   - Clean Architecture (Smart/Dumb Components)
   - Services pour les appels API
   - Custom Hooks pour la logique

2. **Coding Standards** : `frontend/docs/frontend-coding-standards.md`
   - TypeScript Strict
   - CSS Modules
   - Server Components par défaut

## Checklist Pré-Développement

- [ ] Lire les règles d'architecture
- [ ] Identifier la Feature concernée
- [ ] Séparer UI (Dumb) et Logique (Smart/Hooks)

## Structure Feature Type

```
src/features/{feature-name}/
├── components/   # Smart Components
├── hooks/        # Logique (State, Effects)
├── services/     # API Calls
└── types/        # Types locaux
```

## Commandes Utiles (Frontend)

> **Note**: Exécuter les commandes depuis le dossier `frontend/`

// turbo

```bash
cd frontend && npm run dev
```

// turbo

```bash
cd frontend && npm run build
```
