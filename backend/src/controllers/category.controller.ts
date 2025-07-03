import { FastifyRequest, FastifyReply } from 'fastify';
import { RedisHelper } from '../plugin/redis';

export async function getCategories(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };
    
    const cacheKey = `categories:${user.id}`;
    
    // recup le cache si possible
    const cachedCategories = await RedisHelper.getCache(request.server.redis, cacheKey);
    if (cachedCategories) {
      request.server.log.info('Categories retrieved from cache');
      return reply.send(cachedCategories);
    }
    
    const categories = await request.server.prisma.category.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // 5 min cache
    await RedisHelper.setCache(request.server.redis, cacheKey, categories, 300);
    
    return reply.send(categories);
  } catch (error) {
    return reply.code(500).send({ error: "Erreur lors de la récupération des catégories." });
  }
}

export async function createCategory(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };
    
    const { name, description, color } = request.body as {
      name: string;
      description?: string;
      color?: string;
    };

    if (!name) {
      return reply.code(400).send({ error: "Le nom de la catégorie est obligatoire." });
    }

    const category = await request.server.prisma.category.create({
      data: {
        name,
        description,
        color,
        userId: user.id,
      },
    });

    // Invalider le cache si nouvelle catégorie
    await RedisHelper.deleteCache(request.server.redis, `categories:${user.id}`);

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
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };
    
    const { id } = request.params as { id: string };
    const { name, description, color } = request.body as {
      name?: string;
      description?: string;
      color?: string;
    };

    const category = await request.server.prisma.category.update({
      where: { 
        id,
        userId: user.id
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
      },
    });

    // Invalider le cache des catégories de l'utilisateur
    await RedisHelper.deleteCache(request.server.redis, `categories:${user.id}`);

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
    await request.jwtVerify();
    const user = request.user as { id: string; email: string };
    
    const { id } = request.params as { id: string };

    // Vérifier s'il y a des achats liés à cette catégorie dans Neo4j
    const session = request.server.neo4j.getSession();
    try {
      const result = await session.executeRead((tx: any) => 
        tx.run(
          `
          MATCH (p:Purchase)-[:BELONGS_TO]->(c:Category {id: $categoryId})
          RETURN count(p) as purchaseCount
          `,
          { categoryId: id }
        )
      );
      
      const purchasesCount = result.records[0].get('purchaseCount').toNumber();
      
      if (purchasesCount > 0) {
        return reply.code(409).send({ 
          error: "Impossible de supprimer cette catégorie car elle contient des achats." 
        });
      }
    } finally {
      await session.close();
    }

    await request.server.prisma.category.delete({
      where: { 
        id,
        userId: user.id // S'assurer que la catégorie appartient à l'utilisateur
      },
    });

    // Invalidar le cache des catégories de l'utilisateur
    await RedisHelper.deleteCache(request.server.redis, `categories:${user.id}`);

    return reply.send({ message: "Catégorie supprimée avec succès." });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return reply.code(404).send({ error: "Catégorie non trouvée." });
    }
    return reply.code(500).send({ error: "Erreur lors de la suppression de la catégorie." });
  }
}
