import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import purchaseService from '../services/purchase.service';

const prisma = new PrismaClient();

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

    const purchases = await purchaseService.getPurchases({
      userId: user.id,
      categoryId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    return reply.send(purchases);
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
    
    if (!categoryId) {
      return reply.code(400).send({ 
        error: "La catégorie est obligatoire.",
        reçu: { categoryId: body.categoryId, category: body.category }
      });
    }

    if (price <= 0) {
      return reply.code(400).send({ error: "Le prix doit être supérieur à 0." });
    }

    // Vérifier que la catégorie existe (toujours via Prisma)
    const categoryObj = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!categoryObj) {
      return reply.code(404).send({ 
        error: "Catégorie non trouvée.", 
        categoryId: categoryId
      });
    }

    const purchase = await purchaseService.createPurchase({
      description,
      price,
      date,
      userId: user.id,
      categoryId,
      tags
    });

    return reply.code(201).send(purchase);
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
      const category = await prisma.category.findUnique({
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

    const purchase = await purchaseService.updatePurchase(id, user.id, updateData);

    if (!purchase) {
      return reply.code(404).send({ error: "Achat non trouvé." });
    }

    return reply.send(purchase);
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

    const success = await purchaseService.deletePurchase(id, user.id);

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

    const stats = await purchaseService.getPurchaseStats({
      userId: user.id,
      startDate,
      endDate
    });

    return reply.send(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return reply.code(500).send({ error: "Erreur lors de la récupération des statistiques." });
  }
}
