import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import purchaseRoutes from "./routes/purchase.routes";
import jwtPlugin from "./plugin/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import cors from '@fastify/cors'
import driver, { verifyConnectivity } from "./config/neo4j";

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

app.register(fastifyCookie);
app.register(fastifyFormbody); // Support pour application/x-www-form-urlencoded
app.register(jwtPlugin);
app.register(cors, {
  origin: true, // Permettre toutes les origines
  credentials: true, // Autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], // En-têtes autorisés
});


app.register(userRoutes, { prefix: "/api" });
app.register(categoryRoutes, { prefix: "/api" });
app.register(purchaseRoutes, { prefix: "/api" });

app.addHook("onClose", async () => {
  await prisma.$disconnect();
  await driver.close();
  app.log.info('Neo4j et Prisma déconnectés.');
});

// Vérifier la connexion à Neo4j avant de démarrer le serveur
const startServer = async () => {
  try {
    // Vérifier la connexion à Neo4j
    const isNeo4jConnected = await verifyConnectivity();
    if (!isNeo4jConnected) {
      app.log.error('Impossible de se connecter à Neo4j. Vérifiez votre configuration.');
      process.exit(1);
    }

    // Démarrer le serveur
    await app.listen({ port: 3000 });
    app.log.info(`Server listening at ${app.server.address()}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();
