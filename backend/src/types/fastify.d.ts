import 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      email: string;
      username: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}