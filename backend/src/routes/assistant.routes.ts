import { FastifyPluginAsync } from "fastify";
import { assistantController, assistantControllerChromaOnly } from "../controllers/assistant.controller";

const assistantRoutes: FastifyPluginAsync = async (fastify) => {
  // Route principale de l'assistant avec traitement IA
  fastify.post("/assistant", assistantController(fastify));
  
  // Route pour obtenir les résultats bruts de ChromaDB sans traitement IA
  fastify.post("/assistant/raw-query", assistantControllerChromaOnly(fastify));
};

export default assistantRoutes;
