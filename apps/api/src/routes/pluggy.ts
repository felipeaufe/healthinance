import { FastifyPluginAsync } from 'fastify';
import { createConnectToken } from '../services/pluggy.js';
import { createDbClient, pluggyItems } from '@healthinance/database';
import { eq } from '@healthinance/database';

export const pluggyRoutes: FastifyPluginAsync = async (fastify) => {
  // Geração segura de Connect Token para abrir o Pluggy Connect Widget no Frontend
  fastify.post('/api/pluggy/connect-token', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;

    try {
      const accessToken = await createConnectToken(userId);
      return reply.send({
        success: true,
        data: { accessToken },
      });
    } catch (error: unknown) {
      request.log.error(error, 'Erro ao criar connect token da Pluggy');
      const message = error instanceof Error ? error.message : 'Erro ao comunicar com Pluggy API';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  });

  // Lista itens bancários conectados do usuário autenticado
  fastify.get('/api/pluggy/items', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    const db = createDbClient();

    try {
      const items = await db.query.pluggyItems.findMany({
        where: eq(pluggyItems.userId, userId),
      });

      return reply.send({
        success: true,
        data: items,
      });
    } catch (error: unknown) {
      request.log.error(error, 'Erro ao listar items');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao consultar conexões bancárias no banco de dados',
      });
    }
  });
};
