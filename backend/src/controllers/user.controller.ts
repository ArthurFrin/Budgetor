import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendMail, generatePasswordResetEmail } from '../utils/mailer';

export async function getUsers(request: FastifyRequest, reply: FastifyReply) {
  const users = await request.server.prisma.user.findMany({
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

  const user = await request.server.prisma.user.create({
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

  const user = await  request.server.prisma.user.findUnique({
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
    const user = await  request.server.prisma.user.findUnique({
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

export async function forgetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { email } = request.body as { email: string };

  if (!email) {
    return reply.code(400).send({ error: "L'email est obligatoire." });
  }

  // Vérifier si l'utilisateur existe
  const user = await request.server.prisma.user.findUnique({
    where: { email }
  });

  // Pour des raisons de sécurité, toujours renvoyer une réponse positive
  // même si l'utilisateur n'existe pas
  if (!user) {
    return reply.send({ 
      message: "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé."
    });
  }

  // Générer un JWT token pour la réinitialisation avec une expiration d'une heure
  const resetToken = await reply.jwtSign(
    { 
      id: user.id, 
      email: user.email,
      purpose: 'password-reset'
    },
    { 
      expiresIn: '1h' 
    }
  );

  // Générer et envoyer l'email
  try {
    const emailContent = generatePasswordResetEmail(email, resetToken);
    await sendMail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    return reply.send({ 
      message: "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé." 
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return reply.code(500).send({ 
      error: "Une erreur est survenue lors de l'envoi de l'email."
    });
  }
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { token, newPassword } = request.body as { 
    token: string;
    newPassword: string;
  };

  if (!token || !newPassword) {
    return reply.code(400).send({ 
      error: "Le token et le nouveau mot de passe sont obligatoires." 
    });
  }

  try {
    // Vérifier le JWT token
    const payload = await request.server.jwt.verify(token) as { 
      id: string; 
      email: string;
      purpose: string;
    };
    
    // Vérifier si c'est bien un token de réinitialisation de mot de passe
    if (payload.purpose !== 'password-reset') {
      return reply.code(400).send({ 
        error: "Ce lien de réinitialisation est invalide." 
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await request.server.prisma.user.findUnique({
      where: { 
        id: payload.id,
        email: payload.email
      }
    });

    if (!user) {
      return reply.code(400).send({ 
        error: "Ce lien de réinitialisation est invalide ou a expiré." 
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await request.server.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    return reply.send({ 
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe." 
    });
  } catch (error) {
    // Si le token est expiré ou invalide, JWT va lancer une erreur
    return reply.code(400).send({ 
      error: "Ce lien de réinitialisation est invalide ou a expiré." 
    });
  }
}
