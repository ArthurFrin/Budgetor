import neo4j from "neo4j-driver";
import { ChromaClient } from "chromadb";
import { randomUUID } from "crypto";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "neo4j://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "passw0rd"
  )
);

const chroma = new ChromaClient({
  path: process.env.CHROMADB_URL || "http://localhost:8000"
});

const userData = {
  id: "686401171ad85a38dff24fee",
  email: "user@email.com",
  name: "John Doe",
};

const categories = [
  { id: "6865431e211f472b9d4c8b82", name: "Alimentation", color: "#f59e0b" },
  { id: "6865a37745423b08e69be0c5", name: "Autres", color: "#6b7280" },
  { id: "68656a82135373acef3f7d7e", name: "Loisir", color: "#84cc16" },
  { id: "6865a40be4c3db0be2040609", name: "Abonnements", color: "#d946ef" },
  { id: "68659f98135373acef3f7d80", name: "Matériel", color: "#f43f5e" },
];

// Achats avec dates fixes
const purchases = [
  // Février 2025 - raisonnable
  {
    description: "Netflix",
    price: 13.99,
    date: "2025-02-01T08:00:00.000Z",
    categoryId: "6865a40be4c3db0be2040609",
    tags: ["streaming"]
  },
  {
    description: "Courses Carrefour",
    price: 55.25,
    date: "2025-02-10T17:00:00.000Z",
    categoryId: "6865431e211f472b9d4c8b82",
    tags: ["courses"]
  },
  {
    description: "Restaurant italien",
    price: 42.50,
    date: "2025-02-20T19:30:00.000Z",
    categoryId: "6865431e211f472b9d4c8b82",
    tags: ["restaurant"]
  },

  // Mars 2025 - Mois avec +5000€ dépensés
  {
    description: "MacBook Pro M3",
    price: 2499,
    date: "2025-03-05T11:00:00.000Z",
    categoryId: "68659f98135373acef3f7d80",
    tags: ["ordinateur", "apple"]
  },
  {
    description: "iPhone 15 Pro",
    price: 1399,
    date: "2025-03-06T14:00:00.000Z",
    categoryId: "68659f98135373acef3f7d80",
    tags: ["telephone", "apple"]
  },
  {
    description: "Écran Dell 4K",
    price: 599.99,
    date: "2025-03-07T15:00:00.000Z",
    categoryId: "68659f98135373acef3f7d80",
    tags: ["écran"]
  },
  {
    description: "Voyage Amsterdam - Hotel",
    price: 850,
    date: "2025-03-15T18:00:00.000Z",
    categoryId: "68656a82135373acef3f7d7e",
    tags: ["voyage"]
  },

  // Avril 2025 - dépenses modérées
  {
    description: "Netflix",
    price: 13.99,
    date: "2025-04-01T08:00:00.000Z",
    categoryId: "6865a40be4c3db0be2040609",
    tags: ["streaming"]
  },
  {
    description: "Concert Jazz",
    price: 65,
    date: "2025-04-12T20:00:00.000Z",
    categoryId: "68656a82135373acef3f7d7e",
    tags: ["concert"]
  },
  {
    description: "Courses Monoprix",
    price: 48.75,
    date: "2025-04-18T18:00:00.000Z",
    categoryId: "6865431e211f472b9d4c8b82",
    tags: ["courses"]
  },

  // Mai 2025 - dépenses moyennes
  {
    description: "Netflix",
    price: 13.99,
    date: "2025-05-01T08:00:00.000Z",
    categoryId: "6865a40be4c3db0be2040609",
    tags: ["streaming"]
  },
  {
    description: "Weekend Lyon - Hotel",
    price: 220,
    date: "2025-05-10T15:00:00.000Z",
    categoryId: "68656a82135373acef3f7d7e",
    tags: ["weekend"]
  },
  {
    description: "Lave-vaisselle Bosch",
    price: 699,
    date: "2025-05-15T09:00:00.000Z",
    categoryId: "68659f98135373acef3f7d80",
    tags: ["électroménager"]
  },
  {
    description: "Restaurant terrasse",
    price: 58.30,
    date: "2025-05-25T20:00:00.000Z",
    categoryId: "6865431e211f472b9d4c8b82",
    tags: ["restaurant"]
  },

  // Juin 2025 - raisonnable
  {
    description: "Netflix",
    price: 13.99,
    date: "2025-06-01T08:00:00.000Z",
    categoryId: "6865a40be4c3db0be2040609",
    tags: ["streaming"]
  },
  {
    description: "Festival musique",
    price: 120,
    date: "2025-06-18T19:00:00.000Z",
    categoryId: "68656a82135373acef3f7d7e",
    tags: ["festival"]
  },
  {
    description: "Courses Auchan",
    price: 65.20,
    date: "2025-06-22T17:00:00.000Z",
    categoryId: "6865431e211f472b9d4c8b82",
    tags: ["courses"]
  },

  // Juillet 2025 - jusqu'au 5 juillet uniquement
  {
    description: "Vacances Espagne - Location villa",
    price: 1200,
    date: "2025-07-02T12:00:00.000Z",
    categoryId: "68656a82135373acef3f7d7e",
    tags: ["vacances"]
  },
  {
    description: "Vols Espagne",
    price: 380,
    date: "2025-07-03T10:00:00.000Z",
    categoryId: "68656a82135373acef3f7d7e",
    tags: ["voyage"]
  },
  {
    description: "Restaurants Espagne",
    price: 300,
    date: "2025-07-05T20:00:00.000Z",
    categoryId: "6865431e211f472b9d4c8b82",
    tags: ["restaurant"]
  }
];

async function seed() {
  const session = driver.session();
  try {
    console.log("🚀 Début du seed Neo4j + ChromaDB...");

    // 🧹 NETTOYAGE COMPLET DES DONNÉES EXISTANTES
    console.log("🧹 Suppression des données existantes...");
    
    // Supprimer tous les achats et relations pour cet utilisateur
    await session.executeWrite(tx =>
      tx.run(`
        MATCH (u:User {id: $userId})<-[:MADE_BY]-(p:Purchase)
        DETACH DELETE p
      `, { userId: userData.id })
    );

    // Supprimer les catégories orphelines (optionnel)
    await session.executeWrite(tx =>
      tx.run(`
        MATCH (c:Category)
        WHERE NOT (c)<-[:BELONGS_TO]-()
        DELETE c
      `)
    );

    // Nettoyer ChromaDB
    try {
      const purchasesCollection = await chroma.getOrCreateCollection({
        name: "budget_purchases"
      });
      
      // Supprimer tous les documents de cet utilisateur
      const allItems = await purchasesCollection.get();
      const userItems = allItems.metadatas?.filter((meta: any) => meta?.user_id === userData.id);
      
      if (userItems && userItems.length > 0) {
        const idsToDelete = allItems.ids?.filter((_: any, index: number) => 
          allItems.metadatas?.[index]?.user_id === userData.id
        );
        
        if (idsToDelete && idsToDelete.length > 0) {
          await purchasesCollection.delete({ ids: idsToDelete });
          console.log(`🗑️ ${idsToDelete.length} documents supprimés de ChromaDB`);
        }
      }
    } catch (chromaError) {
      console.log("⚠️ Erreur lors du nettoyage ChromaDB (normal si première fois):", (chromaError as Error).message || chromaError);
    }

    console.log("✅ Nettoyage terminé\n");

    // Utilisateur
    await session.executeWrite(tx =>
      tx.run(`MERGE (u:User {id: $userId})`, { userId: userData.id })
    );

    // Catégories
    for (const cat of categories) {
      await session.executeWrite(tx =>
        tx.run(`MERGE (c:Category {id: $categoryId})`, { categoryId: cat.id })
      );
    }

    const purchasesCollection = await chroma.getOrCreateCollection({
      name: "budget_purchases"
    });

    for (const purchase of purchases) {
      const purchaseId = randomUUID();
      const categoryObj =
        categories.find(c => c.id === purchase.categoryId) ||
        { id: "other", name: "Autre", color: "#cccccc" };

      // Neo4j
      await session.executeWrite(tx =>
        tx.run(
          `
          MATCH (u:User {id: $userId})
          MATCH (c:Category {id: $categoryId})
          CREATE (p:Purchase {
            id: $purchaseId,
            description: $description,
            price: $price,
            date: datetime($date),
            tags: $tags,
            createdAt: datetime(),
            updatedAt: datetime()
          })
          CREATE (p)-[:MADE_BY]->(u)
          CREATE (p)-[:BELONGS_TO]->(c)
          `,
          {
            userId: userData.id,
            categoryId: purchase.categoryId,
            purchaseId,
            description: purchase.description,
            price: purchase.price,
            date: purchase.date,
            tags: purchase.tags
          }
        )
      );

      // ChromaDB
      const purchaseDoc = `Achat effectué le ${new Date(purchase.date).toLocaleDateString("fr-FR")} : ${purchase.description} - Montant: ${purchase.price}€ - Catégorie: ${categoryObj.name}${purchase.tags?.length ? ` - Tags: ${purchase.tags.join(", ")}` : ""}`;

      await purchasesCollection.add({
        ids: [purchaseId],
        metadatas: [{
          user_id: userData.id,
          price: purchase.price,
          date: purchase.date,
          category: categoryObj.name,
          category_id: categoryObj.id
        }],
        documents: [purchaseDoc]
      });

      console.log(`✅ Achat créé: ${purchase.description} (${purchase.date})`);
    }

    console.log("\n✅ Seed terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

if (require.main === module) {
  seed();
}
