import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ajout des catégories par défaut...');

  const defaultCategories = [
    {
      name: 'Alimentation',
      description: 'Courses alimentaires, restaurants, boissons',
      color: '#4CAF50'
    },
    {
      name: 'Transport',
      description: 'Essence, transport public, taxi, réparations auto',
      color: '#2196F3'
    },
    {
      name: 'Logement',
      description: 'Loyer, charges, électricité, eau, internet',
      color: '#FF9800'
    },
    {
      name: 'Santé',
      description: 'Médecin, pharmacie, assurance santé',
      color: '#F44336'
    },
    {
      name: 'Loisirs',
      description: 'Cinéma, sport, sorties, hobbies',
      color: '#9C27B0'
    },
    {
      name: 'Vêtements',
      description: 'Habits, chaussures, accessoires',
      color: '#E91E63'
    },
    {
      name: 'Éducation',
      description: 'Livres, formation, cours en ligne',
      color: '#607D8B'
    },
    {
      name: 'Technologie',
      description: 'Électronique, logiciels, abonnements',
      color: '#3F51B5'
    },
    {
      name: 'Autre',
      description: 'Dépenses diverses non catégorisées',
      color: '#795548'
    }
  ];

  for (const category of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
      console.log(`✅ Catégorie "${category.name}" ajoutée`);
    } catch (error) {
      console.log(`❌ Erreur pour la catégorie "${category.name}":`, error);
    }
  }

  console.log('✅ Seed terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
