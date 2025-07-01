import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

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

    const where: any = {
      userId: user.id,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    return reply.send(purchases);
  } catch (error) {
    return reply.code(401).send({ error: "Non authentifié." });
  }
}

export async function createPurchase(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { title, description, price, date, categoryId } = request.body as {
      title: string;
      description?: string;
      price: number;
      date: string;
      categoryId: string;
    };

    if (!title || !price || !date || !categoryId) {
      return reply.code(400).send({ 
        error: "Le titre, le prix, la date et la catégorie sont obligatoires." 
      });
    }

    if (price <= 0) {
      return reply.code(400).send({ error: "Le prix doit être supérieur à 0." });
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return reply.code(404).send({ error: "Catégorie non trouvée." });
    }

    const purchase = await prisma.purchase.create({
      data: {
        title,
        description,
        price,
        date: new Date(date),
        userId: user.id,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return reply.code(201).send(purchase);
  } catch (error) {
    return reply.code(500).send({ error: "Erreur lors de la création de l'achat." });
  }
}

export async function updatePurchase(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { id } = request.params as { id: string };
    const { title, description, price, date, categoryId } = request.body as {
      title?: string;
      description?: string;
      price?: number;
      date?: string;
      categoryId?: string;
    };

    if (price !== undefined && price <= 0) {
      return reply.code(400).send({ error: "Le prix doit être supérieur à 0." });
    }

    // Vérifier que l'achat appartient à l'utilisateur
    const existingPurchase = await prisma.purchase.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingPurchase) {
      return reply.code(404).send({ error: "Achat non trouvé." });
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

    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(date && { date: new Date(date) }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    return reply.send(purchase);
  } catch (error) {
    return reply.code(500).send({ error: "Erreur lors de la mise à jour de l'achat." });
  }
}

export async function deletePurchase(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };

    const { id } = request.params as { id: string };

    // Vérifier que l'achat appartient à l'utilisateur
    const existingPurchase = await prisma.purchase.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingPurchase) {
      return reply.code(404).send({ error: "Achat non trouvé." });
    }

    await prisma.purchase.delete({
      where: { id },
    });

    return reply.send({ message: "Achat supprimé avec succès." });
  } catch (error) {
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

    const where: any = {
      userId: user.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Total des achats
    const totalAmount = await prisma.purchase.aggregate({
      where,
      _sum: {
        price: true
      }
    });

    // Nombre d'achats
    const totalCount = await prisma.purchase.count({ where });

    // Statistiques par catégorie
    const statsByCategory = await prisma.purchase.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        price: true
      },
      _count: {
        _all: true
      }
    });

    // Enrichir avec les noms des catégories
    const categoriesData = await Promise.all(
      statsByCategory.map(async (stat) => {
        const category = await prisma.category.findUnique({
          where: { id: stat.categoryId }
        });
        return {
          category,
          totalAmount: stat._sum.price || 0,
          count: stat._count._all
        };
      })
    );

    return reply.send({
      totalAmount: totalAmount._sum.price || 0,
      totalCount,
      categoriesStats: categoriesData
    });
  } catch (error) {
    return reply.code(500).send({ error: "Erreur lors de la récupération des statistiques." });
  }
}
