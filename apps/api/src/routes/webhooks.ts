import { FastifyPluginAsync } from 'fastify';
import { WebhookEventSchema } from '@healthinance/types';
import { syncItemData } from '../services/pluggy.js';
import { createDbClient, pluggyItems } from '@healthinance/database';
import { eq } from '@healthinance/database';

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // Listener de Webhooks da Pluggy
  // Responde imediatamente 200 OK para evitar timeouts na Pluggy e processa em background
  fastify.post('/api/webhooks/pluggy', async (request, reply) => {
    const parseResult = WebhookEventSchema.safeParse(request.body);

    if (!parseResult.success) {
      request.log.warn({ body: request.body }, 'Payload de webhook Pluggy inválido');
      return reply.status(400).send({ error: 'Payload de webhook inválido' });
    }

    const { event, itemId } = parseResult.data;
    request.log.info({ event, itemId }, 'Webhook Pluggy recebido');

    // Responde 200 imediatamente
    reply.status(200).send({ received: true });

    // Dispara processamento assíncrono em background
    setImmediate(async () => {
      try {
        const db = createDbClient();
        const existingItem = await db.query.pluggyItems.findFirst({
          where: eq(pluggyItems.id, itemId),
        });

        if (existingItem) {
          await syncItemData(itemId, existingItem.userId);
          request.log.info({ itemId }, 'Sincronização de dados do item concluída com sucesso');
        } else {
          request.log.info({ itemId }, 'Item não cadastrado localmente no momento da recepção do webhook');
        }
      } catch (err) {
        request.log.error(err, `Erro ao processar sincronização de webhook para o item ${itemId}`);
      }
    });
  });
};
