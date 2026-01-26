import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import authRoutes from './routes/auth.routes';

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

// ROUTES =====================

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


// Run the server ==================

const start = async () => {
    try {
        await prisma.$connect();
        console.log('✅ connexion à la DB réussie');

        await fastify.listen({port: PORT, host: HOST});
        console.log(`Serveur démarré sur http://${HOST}:${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        await prisma.$disconnect();
        process.exit(1);
    }
};

// kill the server with Ctrl+C
process.on('SIGINT', async() => {
    console.log('\n ⏹️ Arrêt du serveur...')
    await prisma.$disconnect();
    process.exit(0);
});

start();
