# Frontend Coding Standards (Next.js + TypeScript)

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScriptStrict
- **Styling** : CSS Modules (`.module.css`) ou Vanilla CSS.
- **State** : React Hooks (useState, useReducer) + Zustand (si global).

## 📝 Conventions de Nommage

- **Dossiers** : `kebab-case` (ex: `user-profile`)
- **Composants** : `PascalCase` (ex: `UserProfile.tsx`)
- **Fonctions/Hooks** : `camelCase` (ex: `useAuth`, `formatDate`)
- **Fichiers styles** : `Component.module.css`

## 💎 TypeScript

- **Interfaces** : Préférer `interface` à `type` pour les définitions d'objets extensibles.
- **Sentry/Strict** : Pas de `any`. Utiliser `unknown` si nécessaire avec validation (Zod).
- **Props** : Toujours typer les Props des composants.

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => { ... }
```

## 🎨 Styling (CSS Modules)

- Utiliser des classes sémantiques.
- Éviter les IDs pour le styling.
- Variables CSS pour les couleurs et espacements (Design System).

```css
/* button.module.css */
.primaryButton {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
}
```

## 🚀 Bonnes Pratiques Next.js

1.  **Server Components par défaut** : Utiliser `"use client"` uniquement si nécessaire (interactivité, hooks).
2.  **Image Optimization** : Toujours utiliser `<Image />` de Next.js.
3.  **Links** : Utiliser `<Link />` pour la navigation interne.
