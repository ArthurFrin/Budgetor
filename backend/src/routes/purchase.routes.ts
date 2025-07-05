import { FastifyInstance } from 'fastify';
import { 
  getPurchases, 
  createPurchase,
  getPurchaseStats,
  getMonthlyPurchaseStats
} from '../controllers/purchase.controller';

async function purchaseRoutes(fastify: FastifyInstance) {
  fastify.get('/purchases/stats', getPurchaseStats);
  fastify.get('/purchases/monthly-stats', getMonthlyPurchaseStats);
  fastify.get('/purchases', getPurchases);
  fastify.post('/purchases', createPurchase);
}

export default purchaseRoutes;
