import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";

interface AssistantRequestBody {
  userId: string;
  question: string;
}

export const assistantController = (fastify: FastifyInstance) => async (
  request: FastifyRequest<{ Body: AssistantRequestBody }>,
  reply: FastifyReply
) => {
  const { userId, question } = request.body;

  // Récupérer les collections ChromaDB
  const { userInfo, tips } = await fastify.getBudgetCollections();

  const userData = await userInfo.query({
    queryTexts: [question],
    nResults: 5,
    where: { user_id: userId },
  });

  const tipsData = await tips.query({
    queryTexts: [question],
    nResults: 3,
  });

  const contextUser = userData.documents.flat().join("\n");
  const contextTips = tipsData.documents.flat().join("\n");

  // Historique Redis
  const historyRaw = await fastify.redis.lRange(`chat:session:${userId}`, -6, -1);
  const historyContext = historyRaw
    .map((h) => {
      const { role, content } = JSON.parse(h);
      return `${role === "user" ? "Utilisateur" : "Assistant"} : ${content}`;
    })
    .join("\n");

  // Construire le prompt
  const prompt = `Contexte de la discussion :
${historyContext}

Informations utilisateur :
${contextUser}

Conseils généraux :
${contextTips}

Réponds à la question suivante :
${question}`;

  // Appel Mistral API avec fetch global
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-medium",
      max_tokens: 200,
      messages: [
        {
            role: "system",
            content: "Tu es un assistant expert en gestion de budget. Tu réponds avec un ton direct, non professionnel, et un trash talk, sans être vulgaire. Tes réponses sont concises et ne dépassent pas 5 phrases."
        },

        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur Mistral API: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const aiAnswer = data.choices[0].message.content;

  // Sauvegarder l'historique dans Redis
  await fastify.redis.rPush(
    `chat:session:${userId}`,
    JSON.stringify({ role: "user", content: question })
  );
  await fastify.redis.rPush(
    `chat:session:${userId}`,
    JSON.stringify({ role: "assistant", content: aiAnswer })
  );

  return reply.send({
    answer: aiAnswer,
  });
};
