import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
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

// Configuration CORS avec support des credentials (cookies)
fastify.register(cors, {
    origin: [
        'http://proxyberry.local:4200',
        'http://192.168.1.32:4200',
        'http://localhost:4200'
    ],
    credentials: true, // Permet l'envoi des cookies cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] // Méthodes HTTP autorisées
});

// Configuration du plugin cookie
fastify.register(cookie, {
    secret: process.env.JWT_SECRET || 'your-super-secret-cookie-key',
    parseOptions: {} // Options pour parser les cookies
});

// Configuration JWT
// Le secret doit être stocké dans .env et être très sécurisé
fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
});

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
// Vérifie que le token JWT est valide depuis le cookie HTTP-only
fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
        // Récupérer le token depuis le cookie au lieu du header Authorization
        const token = request.cookies.token;
        
        if (!token) {
            return reply.status(401).send({ error: 'Non authentifié - cookie manquant' });
        }
        
        // Vérifier le token JWT
        const decoded = await fastify.jwt.verify(token);
        request.user = decoded;
    } catch (err) {
        reply.status(401).send({ error: 'Token invalide ou expiré' });
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
        console.log('  POST   /api/auth/register (→ cookie)');
        console.log('  POST   /api/auth/login (→ cookie)');
        console.log('  POST   /api/auth/logout');
        console.log('  GET    /api/auth/me (🔒 protégée)');
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
