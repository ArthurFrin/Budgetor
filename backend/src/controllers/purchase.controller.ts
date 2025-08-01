import { FastifyRequest, FastifyReply } from 'fastify';
import { RedisHelper } from '../plugin/redis';

export async function getPurchases(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { categoryId, startDate, endDate, limit, offset } = request.query as {
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      offset?: string;
    };

    // Récupérer les achats depuis Neo4j
    const purchases = await request.server.neo4j.getPurchases({
      userId: user.id,
      categoryId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    const validCategoryIds = [...new Set(purchases.map(p => p.categoryId))]
      .filter(id => id !== 'other' && id !== null && id !== undefined);
    
    const categories = validCategoryIds.length > 0 ? 
      await request.server.prisma.category.findMany({
        where: {
          id: { in: validCategoryIds }
        }
      }) : [];

    // Mapper les catégories aux achats
    const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]));
    const purchasesWithCategories = purchases.map(purchase => {
      if (!purchase.categoryId) {
        return {
          ...purchase,
          category: { id: 'other', name: 'Autre', color: '#cccccc' }
        };
      }
      return {
        ...purchase,
        category: categoryMap.get(purchase.categoryId) || { id: purchase.categoryId, name: 'Inconnu', color: '#cccccc' }
      };
    });

    return reply.send(purchasesWithCategories);
  } catch (error) {
    console.error('Erreur lors de la récupération des achats:', error);
    return reply.code(500).send({ error: "Erreur lors de la récupération des achats." });
  }
}

export async function createPurchase(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    console.log("Body reçu:", request.body);

    const body = request.body as {
      description?: string;
      price: number;
      date: string;
      categoryId?: string;
      category?: string;
      tags?: string[];
    };
    
    const { description, price, date, tags } = body;
    
    const categoryId = body.categoryId || body.category;

    if (!price) {
      return reply.code(400).send({ 
        error: "Le prix est obligatoire.", 
        reçu: { price }
      });
    }
    
    if (!date) {
      return reply.code(400).send({ 
        error: "La date est obligatoire.",
        reçu: { date }
      });
    }
    
    // La catégorie est optionnelle, on continue même si categoryId est null

    if (price <= 0) {
      return reply.code(400).send({ error: "Le prix doit être supérieur à 0." });
    }

    let categoryObj = null;
    if (categoryId && categoryId !== 'other') {
      categoryObj = await request.server.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!categoryObj) {
        return reply.code(404).send({ 
          error: "Catégorie non trouvée.", 
          categoryId: categoryId
        });
      }
    } else if (categoryId === 'other') {
      categoryObj = { id: 'other', name: 'Autre', color: '#cccccc' };
    }

    const purchase = await request.server.neo4j.createPurchase({
      description,
      price,
      date,
      userId: user.id,
      categoryId,
      tags
    });

    await RedisHelper.deleteCachePattern(request.server.redis, `stats:${user.id}:*`);
    await RedisHelper.deleteCachePattern(request.server.redis, `monthly_stats:${user.id}:*`);
    
    const purchaseWithCategory = {
      ...purchase,
      category: categoryObj
    };
    
    // Ajouter l'achat à ChromaDB pour l'assistant
    try {
      const { purchases } = await request.server.getBudgetCollections();
      
      // Formater les données pour ChromaDB
      const purchaseDoc = `Achat effectué le ${new Date(date).toLocaleDateString('fr-FR')} : ${description || 'Sans description'} - Montant: ${price}€ - Catégorie: ${categoryObj?.name || 'Non catégorisé'}${tags?.length ? ` - Tags: ${tags.join(', ')}` : ''}`;
      
      await purchases.add({
        ids: [purchase.id],
        metadatas: [{ 
          user_id: user.id,
          price: price,
          date: date,
          category: categoryObj?.name || 'Non catégorisé',
          category_id: categoryObj?.id || 'other'
        }],
        documents: [purchaseDoc]
      });
      
      console.log(`Achat ajouté à ChromaDB avec succès. ID: ${purchase.id}`);
    } catch (chromaError) {
      console.error('Erreur lors de l\'ajout de l\'achat à ChromaDB:', chromaError);
    }

    return reply.code(201).send(purchaseWithCategory);
  } catch (error) {
    console.error('Erreur lors de la création de l\'achat:', error);
    return reply.code(500).send({ error: "Erreur lors de la création de l'achat." });
  }
}

export async function getPurchaseStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    // Clé de cache unique par utilisateur et période
    const cacheKey = `stats:${user.id}:${startDate || 'all'}:${endDate || 'now'}`;
    
    // Vérifier si les données sont en cache
    const cachedStats = await RedisHelper.getCache(request.server.redis, cacheKey);
    if (cachedStats) {
      console.log('Returning cached stats');
      return reply.send(cachedStats);
    }

    // Si pas en cache, récupérer les statistiques depuis Neo4j
    const stats = await request.server.neo4j.getPurchaseStats({
      userId: user.id,
      startDate,
      endDate
    });

    // Récupérer les catégories depuis Prisma (filtrer "other" qui n'est pas un ObjectID valide)
    const validCategoryIds = stats.categoriesStats
      .map(stat => stat.categoryId)
      .filter(id => id !== 'other' && id !== null && id !== undefined);
    
    const categories = validCategoryIds.length > 0 ? 
      await request.server.prisma.category.findMany({
        where: {
          id: { in: validCategoryIds }
        }
      }) : [];

    // Mapper les catégories aux statistiques
    const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]));
    const categoriesStats = stats.categoriesStats.map(stat => {
      if (stat.categoryId === 'other') {
        return {
          category: { id: 'other', name: 'Autre', color: '#cccccc' },
          totalAmount: stat.totalAmount,
          count: stat.count
        };
      }
      return {
        category: categoryMap.get(stat.categoryId) || { id: stat.categoryId, name: 'Inconnu', color: '#cccccc' },
        totalAmount: stat.totalAmount,
        count: stat.count
      };
    });

    const statsWithCategories = {
      totalAmount: stats.totalAmount,
      totalCount: stats.totalCount,
      categoriesStats
    };

    // Stocker dans le cache pour 5 minutes (300 secondes)
    await RedisHelper.setCache(request.server.redis, cacheKey, statsWithCategories, 300);

    return reply.send(statsWithCategories);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return reply.code(500).send({ error: "Erreur lors de la récupération des statistiques." });
  }
}

export async function getMonthlyPurchaseStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { startDate, endDate, months } = request.query as {
      startDate?: string;
      endDate?: string;
      months?: string;
    };
    
    const monthsNumber = months ? parseInt(months) : 6;

    // Clé de cache unique par utilisateur, période et nombre de mois
    const cacheKey = `monthly_stats:${user.id}:${startDate || 'all'}:${endDate || 'now'}:${monthsNumber}`;
    
    // Vérifier si les données sont en cache
    const cachedStats = await RedisHelper.getCache(request.server.redis, cacheKey);
    if (cachedStats) {
      console.log('Returning cached monthly stats');
      return reply.send(cachedStats);
    }

    // Récupérer les statistiques mensuelles depuis Neo4j
    const monthlyStats = await request.server.neo4j.getMonthlyPurchaseStats({
      userId: user.id,
      startDate,
      endDate,
      months: monthsNumber
    });

    // Récupérer les catégories depuis Prisma (filtrer "other" qui n'est pas un ObjectID valide)
    const validCategoryIds = monthlyStats.categoryStats
      .map(stat => stat.categoryId)
      .filter(id => id !== 'other' && id !== null && id !== undefined);
    
    const categories = validCategoryIds.length > 0 ? 
      await request.server.prisma.category.findMany({
        where: {
          id: { in: validCategoryIds }
        }
      }) : [];

    // Mapper les catégories aux statistiques
    const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat]));
    
    const categoryStatsWithDetails = monthlyStats.categoryStats.map(stat => {
      if (stat.categoryId === 'other') {
        return {
          category: { id: 'other', name: 'Autre', color: '#cccccc' },
          monthlyAmounts: stat.monthlyAmounts
        };
      }
      return {
        category: categoryMap.get(stat.categoryId) || { id: stat.categoryId, name: 'Inconnu', color: '#cccccc' },
        monthlyAmounts: stat.monthlyAmounts
      };
    });

    const result = {
      months: monthlyStats.months,
      categoryStats: categoryStatsWithDetails
    };
    
    // Stocker dans le cache pour 5 minutes (300 secondes)
    await RedisHelper.setCache(request.server.redis, cacheKey, result, 300);

    return reply.send(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques mensuelles:', error);
    return reply.code(500).send({ error: "Erreur lors de la récupération des statistiques mensuelles." });
  }
}
