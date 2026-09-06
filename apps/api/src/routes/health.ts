import { FastifyPluginAsync } from 'fastify';
import { checkDatabaseConnection } from '@healthinance/database';
import { checkPluggyConnection } from '../services/pluggy.js';


export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: '@healthinance/api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  fastify.get('/health/connections', async (request, reply) => {
    const [dbResult, pluggyResult] = await Promise.all([
      checkDatabaseConnection(),
      checkPluggyConnection(),
    ]);

    const isHealthy = dbResult.ok && pluggyResult.ok;
    const statusCode = isHealthy ? 200 : 503;

    return reply.status(statusCode).send({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      connections: {
        database: {
          status: dbResult.ok ? 'connected' : 'disconnected',
          latencyMs: dbResult.latencyMs,
          error: dbResult.error,
        },
        pluggy: {
          status: pluggyResult.ok ? 'connected' : 'disconnected',
          latencyMs: pluggyResult.latencyMs,
          connectorsAvailable: pluggyResult.connectorsCount,
          error: pluggyResult.error,
        },
      },
    });
  });
};

