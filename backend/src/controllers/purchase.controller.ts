import { FastifyRequest, FastifyReply } from 'fastify';

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

    // Récupérer les catégories depuis Prisma (filtrer les IDs non valides)
    const validCategoryIds = [...new Set(purchases.map(p => p.categoryId))]
      .filter(id => id !== 'other' && id !== null && id !== undefined);
    
    const categories = validCategoryIds.length > 0 ? 
      await request.server.prisma.category.findMany({
        where: {
          id: { in: validCategoryIds }
        }
      }) : [];

    // Mapper les catégories aux achats
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
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

    // Vérifier que la catégorie existe (toujours via Prisma) si une catégorie est fournie
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
      // Utiliser une catégorie par défaut "Autre" 
      categoryObj = { id: 'other', name: 'Autre', color: '#cccccc' };
    }

    // Créer l'achat dans Neo4j
    const purchase = await request.server.neo4j.createPurchase({
      description,
      price,
      date,
      userId: user.id,
      categoryId,
      tags
    });

    // Ajouter les détails de la catégorie
    const purchaseWithCategory = {
      ...purchase,
      category: categoryObj
    };

    return reply.code(201).send(purchaseWithCategory);
  } catch (error) {
    console.error('Erreur lors de la création de l\'achat:', error);
    return reply.code(500).send({ error: "Erreur lors de la création de l'achat." });
  }
}

export async function updatePurchase(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { id } = request.params as { id: string };
    const { title, description, price, date, categoryId, tags } = request.body as {
      title?: string;
      description?: string;
      price?: number;
      date?: string;
      categoryId?: string;
      tags?: string[];
    };

    if (price !== undefined && price <= 0) {
      return reply.code(400).send({ error: "Le prix doit être supérieur à 0." });
    }

    // Vérifier que la catégorie existe si elle est fournie
    if (categoryId) {
      const category = await request.server.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return reply.code(404).send({ error: "Catégorie non trouvée." });
      }
    }

    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (date !== undefined) updateData.date = date;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (tags !== undefined) updateData.tags = tags;

    // Mettre à jour l'achat dans Neo4j
    const purchase = await request.server.neo4j.updatePurchase(id, user.id, updateData);

    if (!purchase) {
      return reply.code(404).send({ error: "Achat non trouvé." });
    }

    // Récupérer les détails de la catégorie depuis Prisma si l'achat a une catégorie
    let category = null;
    if (purchase.categoryId) {
      category = await request.server.prisma.category.findUnique({
        where: { id: purchase.categoryId }
      });
    }

    // Si pas de catégorie ou catégorie non trouvée, afficher comme "Autre"
    const purchaseWithCategory = {
      ...purchase,
      category: category || (purchase.categoryId ? 
        { id: purchase.categoryId, name: 'Inconnu', color: '#cccccc' } : 
        { id: 'other', name: 'Autre', color: '#cccccc' })
    };

    return reply.send(purchaseWithCategory);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'achat:', error);
    return reply.code(500).send({ error: "Erreur lors de la mise à jour de l'achat." });
  }
}

export async function deletePurchase(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { id } = request.params as { id: string };

    const success = await request.server.neo4j.deletePurchase(id, user.id);

    if (!success) {
      return reply.code(404).send({ error: "Achat non trouvé." });
    }

    return reply.send({ message: "Achat supprimé avec succès." });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'achat:', error);
    return reply.code(500).send({ error: "Erreur lors de la suppression de l'achat." });
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

    // Récupérer les statistiques depuis Neo4j
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
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
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

    return reply.send(statsWithCategories);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return reply.code(500).send({ error: "Erreur lors de la récupération des statistiques." });
  }
}
