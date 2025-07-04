import { FastifyPluginAsync } from "fastify";
import { assistantController } from "../controllers/assistant.controller";

const assistantRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/assistant", assistantController(fastify));
};

export default assistantRoutes;
