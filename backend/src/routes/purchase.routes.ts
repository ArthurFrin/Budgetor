import { FastifyInstance } from 'fastify';
import { 
  getPurchases, 
  createPurchase, 
  updatePurchase, 
  deletePurchase,
  getPurchaseStats
} from '../controllers/purchase.controller';

async function purchaseRoutes(fastify: FastifyInstance) {
  // Récupérer les statistiques des achats (doit être avant la route avec :id)
  fastify.get('/purchases/stats', getPurchaseStats);

  // Récupérer tous les achats de l'utilisateur connecté
  fastify.get('/purchases', getPurchases);

  // Créer un nouvel achat
  fastify.post('/purchases', createPurchase);

  // Mettre à jour un achat
  fastify.put('/purchases/:id', updatePurchase);

  // Supprimer un achat
  fastify.delete('/purchases/:id', deletePurchase);
}

export default purchaseRoutes;
