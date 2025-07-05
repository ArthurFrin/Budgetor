import { FastifyInstance } from 'fastify';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/category.controller';

async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get('/categories', getCategories);
  fastify.post('/categories', createCategory);
  fastify.put('/categories/:id', updateCategory);
  fastify.delete('/categories/:id', deleteCategory);
}

export default categoryRoutes;
