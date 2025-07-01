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
