import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import purchaseRoutes from "./routes/purchase.routes";
import jwtPlugin from "./plugin/jwt";
import neo4jPlugin from "./plugin/neo4j";
import redisPlugin from "./plugin/redis";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

app.register(fastifyCookie);
app.register(fastifyFormbody); // Support pour application/x-www-form-urlencoded
app.register(cors, {
  origin: true, // Permettre toutes les origines
  credentials: true, // Autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'], // En-têtes autorisés
});

// Enregistrer les plugins dans le bon ordre
import prismaPlugin from "./plugin/prisma";
app.register(prismaPlugin);
app.register(jwtPlugin);
app.register(neo4jPlugin, {
  uri: process.env.NEO4J_URI || 'neo4j://localhost:7687',
  username: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'passw0rd'
});
app.register(redisPlugin, {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});


app.register(userRoutes, { prefix: "/api" });
app.register(categoryRoutes, { prefix: "/api" });
app.register(purchaseRoutes, { prefix: "/api" });

// Démarrer le serveur
const startServer = async () => {
  try {
    await app.listen({ port: 3000 });
    app.log.info(`Server listening at ${app.server.address()}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();
