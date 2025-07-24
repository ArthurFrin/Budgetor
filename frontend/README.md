# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

# Budgetor Frontend

Budgetor Frontend est l'interface utilisateur de l'application Budgetor, permettant la gestion des budgets, catégories, achats et utilisateurs via une interface moderne et réactive.

## Stack technique

- **React** avec **TypeScript**
- **Vite** : bundler rapide pour le développement et la production
- **ESLint** : linting et qualité du code
- **Tailwind CSS** : framework utilitaire pour le style
- **shadcn/ui** : librairie de composants UI modernes
- **Lucide Icons** : icônes SVG open source
- **Context API** : gestion de l'état global (authentification, etc.)
- **Custom Hooks** : logique réutilisable (catégories, stats, etc.)

## Structure des dossiers

- `src/` : code source principal
  - `components/` : composants UI (formulaires, graphiques, layout, etc.)
  - `contexts/` : contextes React (ex : AuthContext)
  - `hooks/` : hooks personnalisés
  - `lib/` : utilitaires et API client
  - `pages/` : pages principales de l'application (Home, Login, Register, etc.)
  - `types/` : définitions TypeScript des entités (user, category, purchase, etc.)
  - `assets/` : images et ressources statiques

## Démarrage du projet

1. Installer les dépendances :
   ```bash
   cd frontend
   npm install
   ```
2. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
3. Accéder à l'application sur [http://localhost:5173](http://localhost:5173) (par défaut)

## Build et production

Pour builder le projet pour la production :
```bash
npm run build
```
Le dossier `dist/` contiendra les fichiers optimisés.

## Linting et qualité du code

ESLint est configuré pour TypeScript et React. Voir le fichier `eslint.config.js` pour personnaliser les règles.

## Configuration

Les variables d'environnement peuvent être définies dans un fichier `.env` à la racine du projet pour configurer l'URL de l'API et autres paramètres.

## Fonctionnalités principales

- Authentification (login, register, reset password)
- Gestion des achats et des catégories
- Visualisation des statistiques (graphiques, tableaux)
- Assistant conversationnel

## Licence

MIT