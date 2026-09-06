import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import authPlugin from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { pluggyRoutes } from './routes/pluggy.js';
import { webhookRoutes } from './routes/webhooks.js';
import { financeRoutes } from './routes/finances.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Pode ser habilitado se necessário
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(sensible);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(pluggyRoutes);
  await app.register(webhookRoutes);
  await app.register(financeRoutes);

  return app;
}
