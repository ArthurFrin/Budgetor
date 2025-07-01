import { FastifyInstance } from 'fastify';
import { getUsers, createUser, loginUser, logoutUser, getCurrentUser } from '../controllers/user.controller';

export default async function userRoutes(app: FastifyInstance) {
  app.get('/users', getUsers);
  app.post('/register', createUser);
  app.post('/login', loginUser);
  app.post('/logout', logoutUser);
  app.get('/me', getCurrentUser);
}
