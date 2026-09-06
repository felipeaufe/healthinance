import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import * as dotenv from 'dotenv';
import authPlugin from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { pluggyRoutes } from './routes/pluggy.js';
import { webhookRoutes } from './routes/webhooks.js';
import { financeRoutes } from './routes/finances.js';

dotenv.config({ path: '../../.env' });

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
});

async function main() {
  // Plugins essenciais
  await server.register(cors, {
    origin: true,
    credentials: true,
  });
  await server.register(sensible);
  await server.register(authPlugin);

  // Registro de rotas
  await server.register(healthRoutes);
  await server.register(pluggyRoutes);
  await server.register(webhookRoutes);
  await server.register(financeRoutes);

  const port = Number(process.env.PORT) || 3333;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    server.log.info(`🚀 Healthinance API rodando em http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
