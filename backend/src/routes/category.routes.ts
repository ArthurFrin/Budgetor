import { FastifyInstance } from 'fastify';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/category.controller';

async function categoryRoutes(fastify: FastifyInstance) {
  // Récupérer toutes les catégories
  fastify.get('/categories', getCategories);

  // Créer une nouvelle catégorie
  fastify.post('/categories', createCategory);

  // Mettre à jour une catégorie
  fastify.put('/categories/:id', updateCategory);

  // Supprimer une catégorie
  fastify.delete('/categories/:id', deleteCategory);
}

export default categoryRoutes;
