import driver from '../config/neo4j';

export interface Purchase {
  id: string;
  description?: string;
  price: number;
  date: Date | string;
  tags?: string[];
  userId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseService {
  
  /**
   * Crée un achat dans Neo4j
   */
  async createPurchase(purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) {
    const session = driver.session();
    try {
      const result = await session.executeWrite(tx => 
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
            description: purchaseData.description || '',
            price: purchaseData.price,
            date: new Date(purchaseData.date).toISOString(),
            tags: purchaseData.tags || []
          }
        )
      );

      const record = result.records[0];
      if (!record) throw new Error('Aucun enregistrement retourné');

      const purchaseNode = record.get('p').properties;
      const categoryNode = record.get('c').properties;
      
      return {
        ...this._formatPurchase(purchaseNode),
        category: categoryNode
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Récupère tous les achats d'un utilisateur avec filtrage optionnel
   */
  async getPurchases({
    userId,
    categoryId,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  }: {
    userId: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const session = driver.session();
    try {
      let query = `
        MATCH (p:Purchase)-[:MADE_BY]->(u:User {id: $userId})
        MATCH (p)-[:BELONGS_TO]->(c:Category)
      `;

      const params: any = { userId, limit: neo4j.int(limit), offset: neo4j.int(offset) };

      if (categoryId) {
        query += ` WHERE c.id = $categoryId`;
        params.categoryId = categoryId;
      }

      if (startDate) {
        query += categoryId ? ' AND ' : ' WHERE ';
        query += `p.date >= datetime($startDate)`;
        params.startDate = new Date(startDate).toISOString();
      }

      if (endDate) {
        query += categoryId || startDate ? ' AND ' : ' WHERE ';
        query += `p.date <= datetime($endDate)`;
        params.endDate = new Date(endDate).toISOString();
      }

      query += `
        RETURN p, c
        ORDER BY p.date DESC
        SKIP $offset
        LIMIT $limit
      `;

      const result = await session.executeRead(tx => tx.run(query, params));
      
      return result.records.map(record => {
        const purchaseNode = record.get('p').properties;
        const categoryNode = record.get('c').properties;
        
        return {
          ...this._formatPurchase(purchaseNode),
          category: this._formatCategory(categoryNode)
        };
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Met à jour un achat existant
   */
  async updatePurchase(id: string, userId: string, updateData: Partial<Purchase>) {
    const session = driver.session();
    try {
      // Vérifier que l'achat existe et appartient à l'utilisateur
      const checkResult = await session.executeRead(tx => 
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
        setClauses.push('p.description = $description');
        params.description = updateData.description;
      }
      
      if (updateData.price !== undefined) {
        setClauses.push('p.price = $price');
        params.price = updateData.price;
      }
      
      if (updateData.date !== undefined) {
        setClauses.push('p.date = datetime($date)');
        params.date = new Date(updateData.date).toISOString();
      }
      
      if (updateData.tags !== undefined) {
        setClauses.push('p.tags = $tags');
        params.tags = updateData.tags;
      }

      // Toujours mettre à jour updatedAt
      setClauses.push('p.updatedAt = datetime()');

      let query = `
        MATCH (p:Purchase {id: $id})-[:MADE_BY]->(u:User {id: $userId})
        MATCH (p)-[r:BELONGS_TO]->(:Category)
      `;

      // Si categoryId est fourni, mettre à jour la relation de catégorie
      if (updateData.categoryId) {
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
        SET ${setClauses.join(', ')}
        WITH p
        MATCH (p)-[:BELONGS_TO]->(c:Category)
        RETURN p, c
      `;

      const result = await session.executeWrite(tx => tx.run(query, params));
      
      if (result.records.length === 0) return null;
      
      const purchaseNode = result.records[0].get('p').properties;
      const categoryNode = result.records[0].get('c').properties;
      
      return {
        ...this._formatPurchase(purchaseNode),
        category: this._formatCategory(categoryNode)
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Supprime un achat
   */
  async deletePurchase(id: string, userId: string) {
    const session = driver.session();
    try {
      // Vérifier que l'achat existe et appartient à l'utilisateur
      const checkResult = await session.executeRead(tx => 
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
      await session.executeWrite(tx => 
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

  /**
   * Récupère les statistiques d'achats pour un utilisateur
   */
  async getPurchaseStats({
    userId,
    startDate,
    endDate
  }: {
    userId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const session = driver.session();
    try {
      let whereClause = '';
      const params: any = { userId };

      if (startDate) {
        whereClause += ' AND p.date >= datetime($startDate)';
        params.startDate = new Date(startDate).toISOString();
      }

      if (endDate) {
        whereClause += ' AND p.date <= datetime($endDate)';
        params.endDate = new Date(endDate).toISOString();
      }

      // Total des achats et nombre d'achats
      const totalsQuery = `
        MATCH (p:Purchase)-[:MADE_BY]->(u:User {id: $userId})
        WHERE 1=1 ${whereClause}
        RETURN 
          sum(p.price) AS totalAmount,
          count(p) AS totalCount
      `;

      const totalsResult = await session.executeRead(tx => tx.run(totalsQuery, params));
      const totalAmount = totalsResult.records[0].get('totalAmount').toNumber();
      const totalCount = totalsResult.records[0].get('totalCount').toNumber();

      // Statistiques par catégorie
      const statsByCategoryQuery = `
        MATCH (p:Purchase)-[:MADE_BY]->(u:User {id: $userId})
        MATCH (p)-[:BELONGS_TO]->(c:Category)
        WHERE 1=1 ${whereClause}
        RETURN 
          c,
          sum(p.price) AS categoryTotal,
          count(p) AS categoryCount
        ORDER BY categoryTotal DESC
      `;

      const statsByCategoryResult = await session.executeRead(tx => tx.run(statsByCategoryQuery, params));
      
      const categoriesStats = statsByCategoryResult.records.map(record => ({
        category: this._formatCategory(record.get('c').properties),
        totalAmount: record.get('categoryTotal').toNumber(),
        count: record.get('categoryCount').toNumber()
      }));

      return {
        totalAmount,
        totalCount,
        categoriesStats
      };
    } finally {
      await session.close();
    }
  }

  // Méthodes privées pour formater les données

  private _formatPurchase(node: any): Purchase {
    return {
      id: node.id,
      description: node.description,
      price: typeof node.price === 'number' ? node.price : node.price.toNumber(),
      date: this._formatDate(node.date),
      tags: Array.isArray(node.tags) ? node.tags : [],
      userId: node.userId,
      categoryId: node.categoryId,
      createdAt: this._formatDate(node.createdAt),
      updatedAt: this._formatDate(node.updatedAt)
    };
  }

  private _formatCategory(node: any) {
    return {
      id: node.id,
      name: node.name,
      description: node.description,
      color: node.color,
      createdAt: this._formatDate(node.createdAt)
    };
  }

  private _formatDate(neoDate: any): Date {
    // Neo4j retourne les dates sous forme d'objets spéciaux qu'il faut convertir
    if (!neoDate) return new Date();
    
    if (typeof neoDate === 'string') {
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
}

// Ajouter Neo4j pour accéder aux méthodes statiques comme Neo4j.int()
import neo4j from 'neo4j-driver';

// Créer une instance singleton du service
const purchaseService = new PurchaseService();
export default purchaseService;
