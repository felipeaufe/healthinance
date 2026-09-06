import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email?: string;
      role?: string;
      aud?: string;
      exp?: number;
    };
    user: {
      sub: string;
      email?: string;
      role?: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'dev-jwt-secret-min-32-chars-long-placeholder';

  await fastify.register(fastifyJwt, {
    secret: jwtSecret,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token de autenticação Supabase ausente, expirado ou inválido.',
      });
    }
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});
