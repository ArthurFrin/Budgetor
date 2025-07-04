import { ChromaClient } from "chromadb";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // 1. Charger les conseils
  const tipsFile = path.resolve(__dirname, "../tips.json");
  if (!fs.existsSync(tipsFile)) {
    throw new Error(`Le fichier tips.json est introuvable : ${tipsFile}`);
  }

  const tips = JSON.parse(fs.readFileSync(tipsFile, "utf-8")) as string[];

  if (!tips.length) {
    throw new Error("Le fichier tips.json est vide.");
  }

  // 2. Initialiser ChromaClient
  const chroma = new ChromaClient({
    path: process.env.CHROMADB_URL,
  });

  // 3. Récupérer ou créer la collection budget_tips
  const tipsCollection = await chroma.getOrCreateCollection({
    name: "budget_tips",
  });

  console.log(`✅ Collection 'budget_tips' prête.`);

  // 4. Ajouter les conseils
  await tipsCollection.add({
    ids: tips.map(() => uuidv4()),
    documents: tips
  });

  console.log(`✅ ${tips.length} conseils injectés avec succès dans ChromaDB.`);
}

main().catch((err) => {
  console.error("❌ Erreur lors de l’injection :", err);
  process.exit(1);
});
