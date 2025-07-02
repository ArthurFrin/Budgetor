import fp from "fastify-plugin";
import neo4j, { Driver, Session } from "neo4j-driver";
import { FastifyPluginAsync, FastifyInstance } from "fastify";

export interface Neo4jPluginOptions {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

export interface PurchaseData {
  id?: string;
  description?: string;
  price: number;
  date: string | Date;
  tags?: string[];
  userId: string;
  categoryId: string;
}

// Déclaration pour l'extension de Fastify
declare module "fastify" {
  interface FastifyInstance {
    neo4j: {
      driver: Driver;
      // Helper pour récupérer une session
      getSession: () => Session;
      // Helpers pour les achats
      createPurchase: (data: PurchaseData) => Promise<any>;
      getPurchases: (options: {
        userId: string;
        categoryId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
      }) => Promise<any[]>;
      updatePurchase: (
        id: string,
        userId: string,
        updateData: Partial<PurchaseData>
      ) => Promise<any>;
      deletePurchase: (id: string, userId: string) => Promise<boolean>;
      getPurchaseStats: (options: {
        userId: string;
        startDate?: string;
        endDate?: string;
      }) => Promise<{
        totalAmount: number;
        totalCount: number;
        categoriesStats: any[];
      }>;
      // Helpers pour l'initialisation de la base de données
      ensureUserExists: (userId: string, email: string) => Promise<void>;
      ensureCategoryExists: (
        categoryId: string,
        categoryData: { name: string; description?: string; color?: string }
      ) => Promise<void>;
    };
  }
}

const neo4jPlugin: FastifyPluginAsync<Neo4jPluginOptions> = async (
  fastify,
  options
) => {
  const { uri, username, password, database } = options;

  // Création du driver Neo4j
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000,
    encrypted: process.env.NODE_ENV === "production",
  });

  // Vérification de la connexion
  try {
    await driver.verifyConnectivity();
    fastify.log.info("Connexion à Neo4j établie avec succès");
  } catch (error) {
    fastify.log.error("Échec de connexion à Neo4j:", error);
    throw error;
  }

  // Décorateur pour récupérer une session
  const getSession = () => driver.session({ database });

  // Helper pour formater les dates Neo4j
  function formatDate(neoDate: any): Date {
    if (!neoDate) return new Date();

    if (typeof neoDate === "string") {
      return new Date(neoDate);
    }

    if (neoDate.year && neoDate.month) {
      // C'est un objet Date Neo4j
      return new Date(
        neoDate.year.toNumber(),
        neoDate.month.toNumber() - 1, // JS commence à 0 pour les mois
        neoDate.day.toNumber(),
        neoDate.hour.toNumber(),
        neoDate.minute.toNumber(),
        neoDate.second.toNumber(),
        neoDate.nanosecond.toNumber() / 1000000 // Conversion en millisecondes
      );
    }

    // Fallback
    return new Date();
  }

  // Helper pour formater un nœud Purchase
  function formatPurchase(node: any): any {
    return {
      id: node.id,
      description: node.description,
      price:
        typeof node.price === "number" ? node.price : node.price.toNumber(),
      date: formatDate(node.date),
      tags: Array.isArray(node.tags) ? node.tags : [],
      userId: node.userId,
      categoryId: node.categoryId,
      createdAt: formatDate(node.createdAt),
      updatedAt: formatDate(node.updatedAt),
    };
  }

  // Helper pour formater un nœud Category
  function formatCategory(node: any): any {
    return {
      id: node.id,
      name: node.name,
      description: node.description,
      color: node.color,
      createdAt: formatDate(node.createdAt),
    };
  }

  // Créer ou récupérer un nœud User
  async function ensureUserExists(
    userId: string,
    email: string
  ): Promise<void> {
    const session = getSession();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (u:User {id: $userId})
          ON CREATE SET u.email = $email, u.createdAt = datetime()
          `,
          { userId, email }
        )
      );
    } finally {
      await session.close();
    }
  }

  // Créer ou récupérer un nœud Category
  async function ensureCategoryExists(
    categoryId: string,
    categoryData: { name: string; description?: string; color?: string }
  ): Promise<void> {
    const session = getSession();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (c:Category {id: $categoryId})
          ON CREATE SET c.name = $name, 
                         c.description = $description, 
                         c.color = $color, 
                         c.createdAt = datetime()
          `,
          {
            categoryId,
            name: categoryData.name,
            description: categoryData.description || "",
            color: categoryData.color || "#CCCCCC",
          }
        )
      );
    } finally {
      await session.close();
    }
  }

  // Créer un achat
  async function createPurchase(purchaseData: PurchaseData): Promise<any> {
    const session = getSession();
    try {
      // S'assurer que l'utilisateur et la catégorie existent
      await ensureUserExists(purchaseData.userId, ""); // L'email n'est pas important ici, il sera mis à jour si nécessaire
      const categoryDetails = await fastify.prisma.category.findUnique({
        where: { id: purchaseData.categoryId },
      });

      if (categoryDetails) {
        await ensureCategoryExists(purchaseData.categoryId, {
          name: categoryDetails.name,
          description: categoryDetails.description || undefined,
          color: categoryDetails.color || undefined,
        });
      }

      const result = await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (u:User {id: $userId})
          MATCH (c:Category {id: $categoryId})
          CREATE (p:Purchase {
            id: randomUUID(),
            description: $description,
            price: $price,
            date: datetime($date),
            tags: $tags,
            createdAt: datetime(),
            updatedAt: datetime()
          })
          CREATE (p)-[:MADE_BY]->(u)
          CREATE (p)-[:BELONGS_TO]->(c)
          RETURN p, c
          `,
          {
            userId: purchaseData.userId,
            categoryId: purchaseData.categoryId,
            description: purchaseData.description || "",
            price: purchaseData.price,
            date: new Date(purchaseData.date).toISOString(),
            tags: purchaseData.tags || [],
          }
        )
      );

      const record = result.records[0];
      if (!record) throw new Error("Aucun enregistrement retourné");

      const purchaseNode = record.get("p").properties;
      const categoryNode = record.get("c").properties;

      return {
        ...formatPurchase(purchaseNode),
        category: formatCategory(categoryNode),
      };
    } finally {
      await session.close();
    }
  }

  // Récupérer les achats
  async function getPurchases({
    userId,
    categoryId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  }: {
    userId: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const session = getSession();
    try {
      await ensureUserExists(userId, "");

      let query = `
        MATCH (p:Purchase)-[:MADE_BY]->(u:User {id: $userId})
        MATCH (p)-[:BELONGS_TO]->(c:Category)
      `;

      const params: any = {
        userId,
        limit: neo4j.int(limit),
        offset: neo4j.int(offset),
      };

      if (categoryId) {
        query += ` WHERE c.id = $categoryId`;
        params.categoryId = categoryId;
      }

      if (startDate) {
        query += categoryId ? " AND " : " WHERE ";
        query += `p.date >= datetime($startDate)`;
        params.startDate = new Date(startDate).toISOString();
      }

      if (endDate) {
        query += categoryId || startDate ? " AND " : " WHERE ";
        query += `p.date <= datetime($endDate)`;
        params.endDate = new Date(endDate).toISOString();
      }

      query += `
        RETURN p, c
        ORDER BY p.date DESC
        SKIP $offset
        LIMIT $limit
      `;

      const result = await session.executeRead((tx) => tx.run(query, params));

      return result.records.map((record) => {
        const purchaseNode = record.get("p").properties;
        const categoryNode = record.get("c").properties;

        return {
          ...formatPurchase(purchaseNode),
          category: formatCategory(categoryNode),
        };
      });
    } finally {
      await session.close();
    }
  }

  // Mettre à jour un achat
  async function updatePurchase(
    id: string,
    userId: string,
    updateData: Partial<PurchaseData>
  ): Promise<any> {
    const session = getSession();
    try {
      // Vérifier que l'achat existe et appartient à l'utilisateur
      const checkResult = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (p:Purchase {id: $id})-[:MADE_BY]->(u:User {id: $userId})
          RETURN p
          `,
          { id, userId }
        )
      );

      if (checkResult.records.length === 0) {
        return null; // L'achat n'existe pas ou n'appartient pas à l'utilisateur
      }

      let setClauses = [];
      const params: any = { id, userId };

      if (updateData.description !== undefined) {
        setClauses.push("p.description = $description");
        params.description = updateData.description;
      }

      if (updateData.price !== undefined) {
        setClauses.push("p.price = $price");
        params.price = updateData.price;
      }

      if (updateData.date !== undefined) {
        setClauses.push("p.date = datetime($date)");
        params.date = new Date(updateData.date).toISOString();
      }

      if (updateData.tags !== undefined) {
        setClauses.push("p.tags = $tags");
        params.tags = updateData.tags;
      }

      // Toujours mettre à jour updatedAt
      setClauses.push("p.updatedAt = datetime()");

      let query = `
        MATCH (p:Purchase {id: $id})-[:MADE_BY]->(u:User {id: $userId})
        MATCH (p)-[r:BELONGS_TO]->(:Category)
      `;

      // Si categoryId est fourni, mettre à jour la relation de catégorie
      if (updateData.categoryId) {
        // S'assurer que la catégorie existe
        const categoryDetails = await fastify.prisma.category.findUnique({
          where: { id: updateData.categoryId },
        });

        if (categoryDetails) {
          await ensureCategoryExists(updateData.categoryId, {
            name: categoryDetails.name,
            description: categoryDetails.description || undefined,
            color: categoryDetails.color || undefined,
          });
        }

        query += `
          DELETE r
          WITH p
          MATCH (c:Category {id: $categoryId})
          CREATE (p)-[:BELONGS_TO]->(c)
        `;
        params.categoryId = updateData.categoryId;
      } else {
        query += `WITH p, r `;
      }

      // Mettre à jour les propriétés du nœud Purchase
      query += `
        SET ${setClauses.join(", ")}
        WITH p
        MATCH (p)-[:BELONGS_TO]->(c:Category)
        RETURN p, c
      `;

      const result = await session.executeWrite((tx) => tx.run(query, params));

      if (result.records.length === 0) return null;

      const purchaseNode = result.records[0].get("p").properties;
      const categoryNode = result.records[0].get("c").properties;

      return {
        ...formatPurchase(purchaseNode),
        category: formatCategory(categoryNode),
      };
    } finally {
      await session.close();
    }
  }

  // Supprimer un achat
  async function deletePurchase(id: string, userId: string): Promise<boolean> {
    const session = getSession();
    try {
      // Vérifier que l'achat existe et appartient à l'utilisateur
      const checkResult = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (p:Purchase {id: $id})-[:MADE_BY]->(u:User {id: $userId})
          RETURN p
          `,
          { id, userId }
        )
      );

      if (checkResult.records.length === 0) {
        return false; // L'achat n'existe pas ou n'appartient pas à l'utilisateur
      }

      // Supprimer l'achat et toutes ses relations
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (p:Purchase {id: $id})-[:MADE_BY]->(u:User {id: $userId})
          DETACH DELETE p
          `,
          { id, userId }
        )
      );

      return true;
    } finally {
      await session.close();
    }
  }

  // Récupérer les statistiques d'achats
  async function getPurchaseStats({
    userId,
    startDate,
    endDate,
  }: {
    userId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const session = getSession();
    try {
      await ensureUserExists(userId, "");

      let whereClause = "";
      const params: any = { userId };

      if (startDate) {
        whereClause += " AND p.date >= datetime($startDate)";
        params.startDate = new Date(startDate).toISOString();
      }

      if (endDate) {
        whereClause += " AND p.date <= datetime($endDate)";
        params.endDate = new Date(endDate).toISOString();
      }

      // Totaux globaux
      const totalsQuery = `
      MATCH (p:Purchase)-[:MADE_BY]->(u:User {id: $userId})
      WHERE 1=1 ${whereClause}
      RETURN 
        sum(toFloat(p.price)) AS totalAmount,
        count(p) AS totalCount
    `;

      const totalsResult = await session.executeRead((tx) =>
        tx.run(totalsQuery, params)
      );
      const totalsRecord = totalsResult.records[0];

      const rawTotalAmount = totalsRecord.get("totalAmount");
      const totalAmount =
        rawTotalAmount && typeof rawTotalAmount.toNumber === "function"
          ? rawTotalAmount.toNumber()
          : typeof rawTotalAmount === "number"
          ? rawTotalAmount
          : 0;

      const rawTotalCount = totalsRecord.get("totalCount");
      const totalCount =
        rawTotalCount && typeof rawTotalCount.toNumber === "function"
          ? rawTotalCount.toNumber()
          : typeof rawTotalCount === "number"
          ? rawTotalCount
          : 0;

      // Statistiques par catégorie
      const statsByCategoryQuery = `
      MATCH (p:Purchase)-[:MADE_BY]->(u:User {id: $userId})
      MATCH (p)-[:BELONGS_TO]->(c:Category)
      WHERE 1=1 ${whereClause}
      RETURN 
        c,
        sum(toFloat(p.price)) AS categoryTotal,
        count(p) AS categoryCount
      ORDER BY categoryTotal DESC
    `;

      const statsByCategoryResult = await session.executeRead((tx) =>
        tx.run(statsByCategoryQuery, params)
      );

      const categoriesStats = statsByCategoryResult.records.map((record) => {
        const categoryNode = record.get("c").properties;

        const rawCategoryTotal = record.get("categoryTotal");
        const categoryTotal =
          rawCategoryTotal && typeof rawCategoryTotal.toNumber === "function"
            ? rawCategoryTotal.toNumber()
            : typeof rawCategoryTotal === "number"
            ? rawCategoryTotal
            : 0;

        const rawCategoryCount = record.get("categoryCount");
        const categoryCount =
          rawCategoryCount && typeof rawCategoryCount.toNumber === "function"
            ? rawCategoryCount.toNumber()
            : typeof rawCategoryCount === "number"
            ? rawCategoryCount
            : 0;

        return {
          category: formatCategory(categoryNode),
          totalAmount: categoryTotal,
          count: categoryCount,
        };
      });

      return {
        totalAmount,
        totalCount,
        categoriesStats,
      };
    } finally {
      await session.close();
    }
  }

  // Décorateur pour exposer le driver et les méthodes
  fastify.decorate("neo4j", {
    driver,
    getSession,
    createPurchase,
    getPurchases,
    updatePurchase,
    deletePurchase,
    getPurchaseStats,
    ensureUserExists,
    ensureCategoryExists,
  });

  // Fermer le driver lorsque l'application se termine
  fastify.addHook("onClose", async () => {
    await driver.close();
    fastify.log.info("Connexion Neo4j fermée");
  });
};

export default fp(neo4jPlugin, {
  name: "neo4j",
  dependencies: ["prisma"], // Nous utilisons prisma pour récupérer des infos sur les catégories
});
