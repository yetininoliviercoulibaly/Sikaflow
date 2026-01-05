# Frontend Architecture Rules (Next.js)

## 🎯 Vision

L'architecture du Frontend doit rester **simple**, **modulaire** et **maintenable**. Nous évitons la complexité excessive de l'architecture hexagonale stricte (trop lourde pour une UI) au profit d'une **Clean Architecture** adaptée à React/Next.js (Feature-Sliced Design simplifié).

## 🏗️ Structure des Dossiers

La structure suit une logique de **"Features"** (fonctionnalités métiers) et de **"Components"** (UI pure).

```
src/
├── app/                 # Next.js App Router (Pages & Layouts)
│   ├── (auth)/          # Route Group pour l'authentification
│   ├── (dashboard)/     # Route Group pour le dashboard
│   └── layout.tsx       # Root Layout
├── components/          # Composants UI Réutilisables (Dumb)
│   ├── ui/              # Boutons, Inputs, Cards (Design System)
│   └── shared/          # Composants complexes partagés (ex: Navbar)
├── features/            # Modules Métiers (Smart)
│   ├── auth/
│   │   ├── components/  # Composants spécifiques (LoginForm)
│   │   ├── hooks/       # Logique métier (useLogin)
│   │   ├── services/    # Appels API (auth.service.ts)
│   │   └── types/       # Types TS locaux
│   └── ticketing/
├── lib/                 # Configuration globale (Axios, Utils)
└── types/               # Types TS partagés & DTOs
```

## 📐 Règles de Conception (SOLID)

### 1. Séparation Smart vs Dumb Components

- **Dumb (UI)** : Les composants dans `components/ui` ne contiennent **aucune logique métier**. Ils reçoivent des données via `props` et émettent des événements via callbacks. Ils sont purement visuels.
- **Smart (Features)** : Les composants dans `features/*/components` connectent la logique (Hooks) à l'UI.

### 2. Services & API (Interface Segregation)

- Jamais d'appels `fetch` ou `axios` directs dans les composants.
- Utiliser des **Services** (`features/auth/services/auth.service.ts`) qui retournent des données typées.
- Gestion des erreurs centralisée dans les Services ou via Middleware.

### 3. Custom Hooks (Single Responsibility)

- Extraire la logique complexe (State, Effets, Appels API) dans des **Custom Hooks** (`useMagicLink.ts`).
- Le composant ne doit faire que du rendu (`view`).

## 🚫 Anti-Patterns

- ❌ **God Components** : Fichiers de +200 lignes. Découper en sous-composants.
- ❌ **Hardcoded Strings** : Utiliser des fichiers de constantes ou i18n.
- ❌ **Deep Prop Drilling** : Utiliser Context API ou Zustand pour l'état global si nécessaire.
