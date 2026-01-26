import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function todoRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /api/todos/:userEmail
   * Params:
   *   userEmail: string (email de l'utilisateur)
   * 
   * Query params optionnels:
   *   ?isDone=true/false (filtrer par statut)
   */
  fastify.get('/:userEmail', async (request, reply) => {
    try {
      const { userEmail } = request.params as { userEmail: string };
      const { isDone } = request.query as { isDone?: string };

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Utilisateur non trouvé'
        });
      }

      const whereClause: any = { userEmail };
      
      // Si isDone est spécifié, l'ajouter au filtre
      if (isDone !== undefined) {
        whereClause.isDone = isDone === 'true';
      }

      // Récupérer les todos
      const todos = await prisma.todo.findMany({
        where: whereClause,
        orderBy: {
          date: 'desc' // Plus récents en premier
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
   * Body attendu:
   * {
   *   "userEmail": "user@example.com",
   *   "description": "Acheter du pain",
   *   "date": "2026-01-26T10:00:00.000Z" (optionnel, défaut: maintenant)
   * }
   */
  fastify.post('/', async (request, reply) => {
    try {
      const { userEmail, description, date } = request.body as {
        userEmail: string;
        description: string;
        date?: string;
      };

      if (!userEmail || !description) {
        return reply.status(400).send({
          error: 'userEmail et description sont requis'
        });
      }

      if (description.trim().length === 0) {
        return reply.status(400).send({
          error: 'La description ne peut pas être vide'
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Utilisateur non trouvé'
        });
      }

      const newTodo = await prisma.todo.create({
        data: {
          userEmail,
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
   * Params:
   *   id: number (ID du todo)
   * 
   * Body attendu:
   * {
   *   "description": "Nouvelle description",  (optionnel)
   *   "date": "2026-01-26T10:00:00.000Z"      (optionnel)
   * }
   */
  fastify.put('/:id', async (request, reply) => {
    try {
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

      // Vérifier que le todo existe
      const existingTodo = await prisma.todo.findUnique({
        where: { id: todoId }
      });

      if (!existingTodo) {
        return reply.status(404).send({
          error: 'Todo non trouvé'
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

      // Si aucune donnée à mettre à jour
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
   * Params:
   *   id: number (ID du todo)
   */
  fastify.patch('/:id/toggle', async (request, reply) => {
    try {
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
   * Params:
   *   id: number (ID du todo)
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
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