import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function todoRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /api/todos
   * 🔒 PROTÉGÉE - Récupère les todos de l'utilisateur authentifié
   */
  fastify.get('/', {
    onRequest: [fastify.authenticate]  // ← Middleware de protection
  }, async (request, reply) => {
    try {
      // Le user est automatiquement disponible après jwtVerify
      const userEmail = request.user.email;
      const { isDone } = request.query as { isDone?: string };

      // Construire le filtre
      const whereClause: any = { userEmail };
      
      if (isDone !== undefined) {
        whereClause.isDone = isDone === 'true';
      }

      // Récupérer les todos
      const todos = await prisma.todo.findMany({
        where: whereClause,
        orderBy: {
          date: 'desc'
        }
      });

      return reply.status(200).send({
        count: todos.length,
        todos
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la récupération des todos'
      });
    }
  });

  /**
   * POST /api/todos
   * 🔒 PROTÉGÉE - Crée un todo pour l'utilisateur authentifié
   */
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userEmail = request.user.email;  // Depuis le JWT
      const { description, date } = request.body as {
        description: string;
        date?: string;
      };

      // Validation
      if (!description) {
        return reply.status(400).send({
          error: 'description est requise'
        });
      }

      if (description.trim().length === 0) {
        return reply.status(400).send({
          error: 'La description ne peut pas être vide'
        });
      }

      // Créer le todo
      const newTodo = await prisma.todo.create({
        data: {
          userEmail,  // Automatiquement depuis le JWT
          description: description.trim(),
          date: date ? new Date(date) : new Date(),
          isDone: false
        }
      });

      return reply.status(201).send({
        message: 'Todo créé avec succès',
        todo: newTodo
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la création du todo'
      });
    }
  });

  /**
   * PUT /api/todos/:id
   * 🔒 PROTÉGÉE - Met à jour un todo (seulement si c'est le sien)
   */
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userEmail = request.user.email;
      const { id } = request.params as { id: string };
      const { description, date } = request.body as {
        description?: string;
        date?: string;
      };

      const todoId = parseInt(id);

      if (isNaN(todoId)) {
        return reply.status(400).send({
          error: 'ID invalide'
        });
      }

      // Vérifier que le todo existe ET appartient à l'utilisateur
      const existingTodo = await prisma.todo.findUnique({
        where: { id: todoId }
      });

      if (!existingTodo) {
        return reply.status(404).send({
          error: 'Todo non trouvé'
        });
      }

      // Vérifier que le todo appartient à l'utilisateur
      if (existingTodo.userEmail !== userEmail) {
        return reply.status(403).send({
          error: 'Vous n\'êtes pas autorisé à modifier ce todo'
        });
      }

      // Construire les données à mettre à jour
      const updateData: any = {};
      
      if (description !== undefined) {
        if (description.trim().length === 0) {
          return reply.status(400).send({
            error: 'La description ne peut pas être vide'
          });
        }
        updateData.description = description.trim();
      }

      if (date !== undefined) {
        updateData.date = new Date(date);
      }

      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({
          error: 'Aucune donnée à mettre à jour'
        });
      }

      // Mettre à jour le todo
      const updatedTodo = await prisma.todo.update({
        where: { id: todoId },
        data: updateData
      });

      return reply.status(200).send({
        message: 'Todo mis à jour avec succès',
        todo: updatedTodo
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la mise à jour du todo'
      });
    }
  });

  /**
   * PATCH /api/todos/:id/toggle
   * 🔒 PROTÉGÉE - Toggle le statut d'un todo
   */
  fastify.patch('/:id/toggle', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userEmail = request.user.email;
      const { id } = request.params as { id: string };
      const todoId = parseInt(id);

      if (isNaN(todoId)) {
        return reply.status(400).send({
          error: 'ID invalide'
        });
      }

      // Vérifier que le todo existe
      const existingTodo = await prisma.todo.findUnique({
        where: { id: todoId }
      });

      if (!existingTodo) {
        return reply.status(404).send({
          error: 'Todo non trouvé'
        });
      }

      // Vérifier la propriété
      if (existingTodo.userEmail !== userEmail) {
        return reply.status(403).send({
          error: 'Vous n\'êtes pas autorisé à modifier ce todo'
        });
      }

      // Inverser le statut
      const updatedTodo = await prisma.todo.update({
        where: { id: todoId },
        data: {
          isDone: !existingTodo.isDone
        }
      });

      return reply.status(200).send({
        message: `Todo marqué comme ${updatedTodo.isDone ? 'terminé' : 'non terminé'}`,
        todo: updatedTodo
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la mise à jour du todo'
      });
    }
  });

  /**
   * DELETE /api/todos/:id
   * 🔒 PROTÉGÉE - Supprime un todo
   */
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userEmail = request.user.email;
      const { id } = request.params as { id: string };
      const todoId = parseInt(id);

      if (isNaN(todoId)) {
        return reply.status(400).send({
          error: 'ID invalide'
        });
      }

      // Vérifier que le todo existe
      const existingTodo = await prisma.todo.findUnique({
        where: { id: todoId }
      });

      if (!existingTodo) {
        return reply.status(404).send({
          error: 'Todo non trouvé'
        });
      }

      // Vérifier la propriété
      if (existingTodo.userEmail !== userEmail) {
        return reply.status(403).send({
          error: 'Vous n\'êtes pas autorisé à supprimer ce todo'
        });
      }

      // Supprimer le todo
      await prisma.todo.delete({
        where: { id: todoId }
      });

      return reply.status(200).send({
        message: 'Todo supprimé avec succès'
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Erreur lors de la suppression du todo'
      });
    }
  });
}