import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/user.routes";
import jwtPlugin from "./plugin/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import cors from '@fastify/cors'

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

app.register(fastifyCookie);
app.register(fastifyFormbody); // Support pour application/x-www-form-urlencoded
app.register(jwtPlugin);
app.register(cors, {
  origin: true, // Permettre toutes les origines
  credentials: true, // Autoriser les cookies
});


app.register(userRoutes, { prefix: "/api" });

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
