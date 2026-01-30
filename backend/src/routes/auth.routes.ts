import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.utils.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function authRoutes(fastify: FastifyInstance) {
    // @TODO utiliser des models pour typer les structures attendues par les requêtes
    // @TODO utiliser des services pour les interactions avec la base de donnée
    // @TODO utiliser des middleware pour vérifier la connection
    // factoriser les moyens de validation avec zod
  /**
   * Body attendu:
   * {
   *   "email": "user@example.com",
   *   "username": "John Doe",
   *   "password": "monMotDePasse123"
   * }
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, username, password } = request.body as {
        email: string;
        username: string;
        password: string;
      };

      if (!email || !username || !password) {
        return reply.status(400).send({
          error: 'Tous les champs sont requis (email, username, password)'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({
          error: 'Format d\'email invalide'
        });
      }

      // Validation longueur mot de passe
      if (password.length < 6) {
        return reply.status(400).send({
          error: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return reply.status(409).send({
          error: 'Un utilisateur avec cet email existe déjà'
        });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword
        }
      });

      // Générer un JWT
      const token = fastify.jwt.sign({
        email: newUser.email,
        username: newUser.username
      });

      // Placer le token dans un cookie HTTP-only sécurisé
      reply.setCookie('token', token, {
        httpOnly: true,  // Pas accessible en JavaScript (protection XSS)
        secure: process.env.NODE_ENV === 'production',  // HTTPS uniquement en production
        sameSite: 'lax',  // Protection CSRF (lax pour permettre navigation)
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 jours
        path: '/'
      });

      return reply.status(201).send({
        message: 'Utilisateur créé avec succès',
        user: {
          email: newUser.email,
          username: newUser.username
        }
        // Plus de token dans le body !
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la création de l\'utilisateur'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Connexion + retour d'un JWT
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      if (!email || !password) {
        return reply.status(400).send({
          error: 'Email et mot de passe requis'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });
      if (!user) {
        return reply.status(401).send({
          error: 'Email ou mot de passe incorrect'
        });
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return reply.status(401).send({
          error: 'Email ou mot de passe incorrect'
        });
      }

      // Générer un JWT
      const token = fastify.jwt.sign({
        email: user.email,
        username: user.username
      });

      // Placer le token dans un cookie HTTP-only sécurisé
      reply.setCookie('token', token, {
        httpOnly: true,  // Pas accessible en JavaScript (protection XSS)
        secure: process.env.NODE_ENV === 'production',  // HTTPS uniquement en production
        sameSite: 'lax',  // Protection CSRF (lax pour permettre navigation)
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 jours
        path: '/'
      });

      return reply.status(200).send({
        message: 'Connexion réussie',
        user: {
          email: user.email,
          username: user.username
        }
        // Plus de token dans le body !
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la connexion'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Déconnexion : supprime le cookie d'authentification
   */
  fastify.post('/logout', async (request, reply) => {
    try {
      // Supprimer le cookie en le définissant avec maxAge = 0
      reply.clearCookie('token', {
        path: '/'
      });

      return reply.status(200).send({
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la déconnexion'
      });
    }
  });

  /**
   * GET /api/auth/me
   * 🔒 PROTÉGÉE - Récupère l'utilisateur actuellement authentifié
   * Permet au frontend de vérifier l'authentification sans décoder le JWT
   */
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // Le user est disponible après l'authentification
      return reply.status(200).send({
        user: {
          email: request.user.email,
          username: request.user.username
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la récupération de l\'utilisateur'
      });
    }
  });
}