import { FastifyInstance } from 'fastify';
import { getUsers, createUser } from '../controllers/user.controller';

export default async function userRoutes(app: FastifyInstance) {
  app.get('/users', getUsers);
  app.post('/users', createUser);
}
