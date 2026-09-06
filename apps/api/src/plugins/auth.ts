import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { createRemoteJWKSet, jwtVerify, decodeProtectedHeader } from 'jose';

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

let jwksInstance: ReturnType<typeof createRemoteJWKSet> | null = null;

function getSupabaseJWKS(supabaseUrl: string) {
  if (!jwksInstance) {
    const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
    jwksInstance = createRemoteJWKSet(jwksUrl);
  }
  return jwksInstance;
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'dev-jwt-secret-min-32-chars-long-placeholder';

  await fastify.register(fastifyJwt, {
    secret: jwtSecret,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.log.warn({ headers: request.headers }, 'Cabeçalho Authorization ausente ou inválido');
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token de autenticação Supabase ausente no cabeçalho Authorization.',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token Bearer vazio no cabeçalho Authorization.',
      });
    }

    try {
      const header = decodeProtectedHeader(token);

      // Se o token for assinado assimetricamente (ES256 / RS256) pelo Supabase Auth
      if (header.alg === 'ES256' || header.alg === 'RS256') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('URL do Supabase não configurada para validação JWKS.');
        }

        const JWKS = getSupabaseJWKS(supabaseUrl);
        const { payload } = await jwtVerify(token, JWKS);

        request.user = {
          sub: String(payload.sub),
          email: payload.email as string | undefined,
          role: payload.role as string | undefined,
        };
        return;
      }

      // Fallback para HS256 (tokens locais de teste Vitest assinados com fastify.jwt)
      await request.jwtVerify();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      request.log.warn({ err }, `Falha na verificação de autenticação JWT: ${errMsg}`);
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: `Token de autenticação Supabase inválido ou expirado: ${errMsg}`,
      });
    }
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});

