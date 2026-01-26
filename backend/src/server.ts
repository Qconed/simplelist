import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import authRoutes from './routes/auth.routes';
import todoRoutes from './routes/todo.routes';

const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 3000; // if reading the env file fails, defaults to 3000
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
    logger: true // logger: true permet de voir les requêtes HTTP dans la console
});

fastify.register(cors, {
    origin: true,    // @TODO AUTORISE TOUTES LES ORIGINES, à changer une fois en prod
    credentials: true
});

// Configuration JWT
// Le secret doit être stocké dans .env et être très sécurisé
fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
});

// ========================================
// DÉCORATEURS (pour TypeScript)
// ========================================

// Ajoute les types pour JWT dans Fastify
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any;
    }
    interface FastifyRequest {
        user: {
            email: string;
            username: string;
        };
    }
}

// Middleware d'authentification
// Vérifie que le token JWT est valide
fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.status(401).send({ error: 'Token invalide ou manquant' });
    }
});

// ========================================
// ROUTES
// ========================================

fastify.get('/health', async (request, reply) => {
    return {
        status: 'ok',
        message: 'The todo list is correctly running',
        timestamp: new Date().toISOString(),
    };
});

fastify.get('/', async (request, reply) => {
  return { 
    message: 'Todo List API',
    version: '1.0.0'
  };
});

fastify.register(authRoutes, {prefix: '/api/auth'});
fastify.register(todoRoutes, {prefix: '/api/todos'});


// Run the server ==================

const start = async () => {
    try {
        await prisma.$connect();
        console.log('✅ connexion à la DB réussie');

        await fastify.listen({port: PORT, host: HOST});
        console.log(`🚀 Serveur démarré sur http://${HOST}:${PORT}`);
        console.log('\n📋 Routes disponibles:');
        console.log('  GET    /health');
        console.log('  GET    /');
        console.log('  POST   /api/auth/register');
        console.log('  POST   /api/auth/login (+ JWT)');
        console.log('  GET    /api/todos (🔒 protégée)');
        console.log('  POST   /api/todos (🔒 protégée)');
        console.log('  PUT    /api/todos/:id (🔒 protégée)');
        console.log('  PATCH  /api/todos/:id/toggle (🔒 protégée)');
        console.log('  DELETE /api/todos/:id (🔒 protégée)');
        
    } catch (err) {
        fastify.log.error(err);
        await prisma.$disconnect();
        process.exit(1);
    }
};

process.on('SIGINT', async() => {
    console.log('\n ⏹️ Arrêt du serveur...')
    await prisma.$disconnect();
    process.exit(0);
});

start();
