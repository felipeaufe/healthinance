import { FastifyPluginAsync } from 'fastify';
import { createConnectToken, syncItemData } from '../services/pluggy.js';
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

  // Sincronização sob demanda de um item bancário específico
  fastify.post<{ Params: { id: string } }>(
    '/api/pluggy/items/:id/sync',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id: itemId } = request.params;

      if (!itemId) {
        return reply.status(400).send({
          success: false,
          message: 'ID do item é obrigatório',
        });
      }

      const db = createDbClient();

      try {
        // Verifica se o item já existe localmente
        const existingItem = await db.query.pluggyItems.findFirst({
          where: eq(pluggyItems.id, itemId),
        });

        // Se já existe e pertence a outro usuário, bloqueia com 403 Forbidden
        if (existingItem && existingItem.userId !== userId) {
          request.log.warn(
            { itemId, existingUserId: existingItem.userId, requestingUserId: userId },
            'Tentativa de sincronizar item pertencente a outro usuário'
          );
          return reply.status(403).send({
            success: false,
            message: 'Acesso negado: este item bancário pertence a outro usuário',
          });
        }

        // Executa sincronização completa do item, contas e transações
        const syncResult = await syncItemData(itemId, userId);

        return reply.send({
          success: true,
          message: 'Item sincronizado com sucesso',
          data: syncResult,
        });
      } catch (error: unknown) {
        request.log.error(error, `Erro ao sincronizar item Pluggy ${itemId}`);
        const message = error instanceof Error ? error.message : 'Erro ao comunicar com Pluggy API';
        return reply.status(500).send({
          success: false,
          message: 'Falha ao sincronizar dados do item bancário',
          error: message,
        });
      }
    }
  );
};

