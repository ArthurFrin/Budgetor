import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/user.routes';

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

app.register(userRoutes, { prefix: '/api' });

app.addHook('onClose', async () => {
  await prisma.$disconnect();
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
