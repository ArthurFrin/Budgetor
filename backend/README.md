# Budgetor Backend

Ce backend gère l'API de l'application Budgetor. Il est conçu pour la gestion de budgets, catégories, achats, utilisateurs.

## Stack technique

- **Node.js** avec **TypeScript**
- **Fastify** : framework HTTP rapide et moderne
- **Prisma** : ORM pour MongoDB
- **MongoDB** : base de données principale
- **Neo4j** : base de données orientée graphes (pour certains traitements)
- **Redis** : cache et gestion de sessions
- **ChromaDB** : gestion de l'embedding et recherche sémantique
- **JWT** : authentification par token
- **Nodemailer** : envoi d'emails
- **Bcrypt** : hash des mots de passe

## Structure des dossiers

- `src/` : code source principal
  - `controllers/` : logique métier des routes
  - `routes/` : définition des endpoints API
  - `middleware/` : middlewares Fastify
  - `plugin/` : plugins pour Fastify (connexion DB, JWT, etc.)
  - `utils/` : utilitaires (ex : mailer)
- `prisma/` : schéma Prisma et scripts liés à la base
- `scripts/` : scripts d'initialisation (Neo4j, tips)

## Dépendances principales

Voir le fichier `package.json` pour la liste complète. Les plus importantes :
- `fastify`, `@fastify/cors`, `@fastify/jwt`, `@fastify/cookie`, `@fastify/formbody`
- `prisma`, `@prisma/client`
- `neo4j-driver`, `redis`, `chromadb`
- `nodemailer`, `bcrypt`, `uuid`, `dotenv`

## Démarrage du projet

1. Installer les dépendances :
   ```bash
   cd backend
   npm install
   ```
2. Configurer les variables d'environnement dans un fichier `.env` (voir exemple dans le projet)
3. Lancer le serveur en mode développement :
   ```bash
   npm run dev
   ```
4. Pour builder le projet :
   ```bash
   npm run build
   ```
5. Pour démarrer en production :
   ```bash
   npm start
   ```

## Scripts utiles

- `npm run init` : initialise Neo4j et les tips
- `npm run seed` : (si présent) pour peupler la base MongoDB

## Configuration de la base de données

- MongoDB : renseigner l'URL dans la variable d'environnement `DATABASE_URL`
- Neo4j : configurer l'accès dans les plugins correspondants
- Redis : configurer l'accès dans les plugins correspondants

## Prisma

Le schéma Prisma se trouve dans `prisma/schema.prisma`. Pour générer le client :
```bash
npx prisma generate
```

## API

Les routes sont définies dans `src/routes/`. Voir le code pour la documentation des endpoints.

## Documentation API avec Swagger

La documentation interactive de l'API est disponible via Swagger. Pour y accéder :

1. Démarrez le serveur backend.
2. Rendez-vous sur l'URL `/docs` (par défaut : http://localhost:3000/docs).
3. Vous pouvez explorer et tester les endpoints directement depuis l'interface Swagger.

Swagger est intégré via le plugin Fastify Swagger. Pour plus d'informations sur la configuration, consultez le fichier `src/plugin/swagger.ts` (si présent).

## Licence

Projet sous licence ISC.
