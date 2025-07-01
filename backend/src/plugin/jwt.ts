import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default fp(async function (app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "your-secret-key",
    sign: {
      expiresIn: "30d",
    },
    cookie: {
      cookieName: "authToken",
      signed: false
    }
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ error: "Token invalide ou manquant." });
      }
    }
  );
});
