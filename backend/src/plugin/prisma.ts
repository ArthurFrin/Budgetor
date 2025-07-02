import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

// Déclaration pour l'extension de Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient();

  // Décorateur pour exposer le client Prisma
  fastify.decorate('prisma', prisma);

  // Fermer le client Prisma lorsque l'application se termine
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    fastify.log.info('Connexion Prisma fermée');
  });
};

export default fp(prismaPlugin, {
  name: 'prisma'
});
