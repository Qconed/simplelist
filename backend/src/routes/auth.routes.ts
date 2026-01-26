import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.utils';
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

      // Validation format email
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

      return reply.status(201).send({
        message: 'Utilisateur créé avec succès',
        user: {
          email: newUser.email,
          username: newUser.username
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la création de l\'utilisateur'
      });
    }
  });

  /**
   * Body attendu:
   * {
   *   "email": "user@example.com",
   *   "password": "monMotDePasse123"
   * }
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

      return reply.status(200).send({
        message: 'Connexion réussie',
        user: {
          email: user.email,
          username: user.username
        }
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la connexion'
      });
    }
  });
}