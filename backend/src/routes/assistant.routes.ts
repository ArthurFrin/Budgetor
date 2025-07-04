import { FastifyPluginAsync } from "fastify";
import { assistantController } from "../controllers/assistant.controller";
import { assistantRawQueryController } from "../controllers/assistant-raw-query.controller";

const assistantRoutes: FastifyPluginAsync = async (fastify) => {
  // Route principale de l'assistant avec traitement IA
  fastify.post("/assistant", assistantController(fastify));
  
  // Route pour obtenir les résultats bruts de ChromaDB sans traitement IA
  fastify.post("/assistant/raw-query", assistantRawQueryController(fastify));
};

export default assistantRoutes;
