import neo4j from 'neo4j-driver';

// Utilisez les variables d'environnement pour la configuration
const neo4jUri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const neo4jUser = process.env.NEO4J_USER || 'neo4j';
const neo4jPassword = process.env.NEO4J_PASSWORD || 'password';

// Créer une instance du driver Neo4j
const driver = neo4j.driver(
  neo4jUri,
  neo4j.auth.basic(neo4jUser, neo4jPassword),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000,
    // Désactiver TLS si en local (développement)
    encrypted: process.env.NODE_ENV === 'production',
  }
);

// Fonction pour vérifier la connexion à la base de données
export async function verifyConnectivity() {
  try {
    await driver.verifyConnectivity();
    console.log('Connexion à Neo4j établie avec succès');
    return true;
  } catch (error) {
    console.error('Échec de connexion à Neo4j:', error);
    return false;
  }
}

export default driver;
