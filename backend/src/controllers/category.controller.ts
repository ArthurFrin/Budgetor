import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getCategories(request: FastifyRequest, reply: FastifyReply) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return reply.send(categories);
  } catch (error) {
    return reply.code(500).send({ error: "Erreur lors de la récupération des catégories." });
  }
}

export async function createCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { name, description, color } = request.body as {
      name: string;
      description?: string;
      color?: string;
    };

    if (!name) {
      return reply.code(400).send({ error: "Le nom de la catégorie est obligatoire." });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        color,
      },
    });

    return reply.code(201).send(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return reply.code(409).send({ error: "Une catégorie avec ce nom existe déjà." });
    }
    return reply.code(500).send({ error: "Erreur lors de la création de la catégorie." });
  }
}

export async function updateCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const { name, description, color } = request.body as {
      name?: string;
      description?: string;
      color?: string;
    };

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
      },
    });

    return reply.send(category);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return reply.code(404).send({ error: "Catégorie non trouvée." });
    }
    if (error.code === 'P2002') {
      return reply.code(409).send({ error: "Une catégorie avec ce nom existe déjà." });
    }
    return reply.code(500).send({ error: "Erreur lors de la mise à jour de la catégorie." });
  }
}

export async function deleteCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };

    // Vérifier s'il y a des achats liés à cette catégorie
    const purchasesCount = await prisma.purchase.count({
      where: { categoryId: id }
    });

    if (purchasesCount > 0) {
      return reply.code(409).send({ 
        error: "Impossible de supprimer cette catégorie car elle contient des achats." 
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return reply.send({ message: "Catégorie supprimée avec succès." });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return reply.code(404).send({ error: "Catégorie non trouvée." });
    }
    return reply.code(500).send({ error: "Erreur lors de la suppression de la catégorie." });
  }
}
