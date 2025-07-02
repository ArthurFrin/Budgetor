import driver from '../src/config/neo4j';

/**
 * Script pour initialiser la base de données Neo4j
 * - Création des contraintes
 * - Création des index
 */
async function initNeo4j() {
  const session = driver.session();
  
  try {
    console.log('Initialisation de Neo4j...');
    
    // Contrainte sur l'ID des achats
    await session.executeWrite(tx =>
      tx.run('CREATE CONSTRAINT purchase_id_unique IF NOT EXISTS FOR (p:Purchase) REQUIRE p.id IS UNIQUE')
    );
    console.log('✅ Contrainte sur l\'ID des achats créée');
    
    // Index sur la date d'achat pour des recherches plus rapides
    await session.executeWrite(tx =>
      tx.run('CREATE INDEX purchase_date_idx IF NOT EXISTS FOR (p:Purchase) ON (p.date)')
    );
    console.log('✅ Index sur la date d\'achat créé');
    
    // Index sur le prix d'achat
    await session.executeWrite(tx =>
      tx.run('CREATE INDEX purchase_price_idx IF NOT EXISTS FOR (p:Purchase) ON (p.price)')
    );
    console.log('✅ Index sur le prix d\'achat créé');

    console.log('Neo4j initialisé avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Neo4j:', error);
  } finally {
    await session.close();
  }
  
  // Fermer le driver
  await driver.close();
}

initNeo4j();
