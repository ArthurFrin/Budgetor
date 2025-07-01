import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function getUsers(request: FastifyRequest, reply: FastifyReply) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    },
  });
  return reply.send(users);
}

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const { email, name, password } = request.body as {
    email: string;
    name?: string;
    password: string;
  };

  if (!password) {
    return reply.code(400).send({ error: "Le mot de passe est obligatoire." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  const { password: _, ...userSafe } = user;

  return reply.code(201).send(userSafe);
}

export async function loginUser(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };

  if (!email || !password) {
    return reply.code(400).send({ error: "Email et mot de passe sont requis." });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return reply.code(401).send({ error: "Identifiants invalides." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return reply.code(401).send({ error: "Identifiants invalides." });
  }

  // Générer le token JWT
  const token = await reply.jwtSign({ 
    id: user.id, 
    email: user.email 
  });

  // Définir le cookie httpOnly
  reply.setCookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
    path: '/'
  });

  const { password: _, ...userSafe } = user;

  return reply.send(userSafe);
}

export async function logoutUser(request: FastifyRequest, reply: FastifyReply) {
  // Supprimer le cookie d'authentification
  reply.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  return reply.send({ message: "Déconnexion réussie." });
}

export async function getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Vérifier le JWT depuis le cookie
    await request.jwtVerify();
    
    const payload = request.user as { id: string; email: string };
    
    // Récupérer les données complètes de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (!user) {
      return reply.code(404).send({ error: "Utilisateur non trouvé." });
    }

    return reply.send(user);
  } catch (err) {
    return reply.code(401).send({ error: "Non authentifié." });
  }
}
