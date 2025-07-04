// src/plugins/chromadb.ts
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { ChromaClient, Collection } from "chromadb";

declare module "fastify" {
  interface FastifyInstance {
    chroma: ChromaClient;
    getBudgetCollections: () => Promise<{
      userInfo: Collection;
      tips: Collection;
    }>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const chroma = new ChromaClient({
    path: process.env.CHROMADB_URL,
  });

  // Décore l'instance avec le client
  fastify.decorate("chroma", chroma);

  // Méthode pratique pour récupérer les collections
  fastify.decorate(
    "getBudgetCollections",
    async () => {
      const userInfo = await chroma.getOrCreateCollection({
        name: "budget_user_info",
      });
      const tips = await chroma.getOrCreateCollection({
        name: "budget_tips",
      });
      return { userInfo, tips };
    }
  );
});
