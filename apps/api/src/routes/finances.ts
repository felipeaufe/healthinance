import { FastifyPluginAsync } from 'fastify';
import { createDbClient, pluggyAccounts, pluggyTransactions } from '@healthinance/database';
import { eq, desc } from '@healthinance/database';

export const financeRoutes: FastifyPluginAsync = async (fastify) => {
  // Lista contas bancárias do usuário
  fastify.get('/api/accounts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    const db = createDbClient();

    try {
      const accounts = await db.query.pluggyAccounts.findMany({
        where: eq(pluggyAccounts.userId, userId),
      });

      return reply.send({
        success: true,
        data: accounts,
      });
    } catch (error) {
      request.log.error(error, 'Erro ao buscar contas');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar contas bancárias',
      });
    }
  });

  // Lista transações do usuário (com ordenação decrescente por data)
  fastify.get('/api/transactions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    const db = createDbClient();

    try {
      const transactions = await db.query.pluggyTransactions.findMany({
        where: eq(pluggyTransactions.userId, userId),
        orderBy: [desc(pluggyTransactions.date)],
        limit: 100,
      });

      return reply.send({
        success: true,
        data: transactions,
      });
    } catch (error) {
      request.log.error(error, 'Erro ao buscar transações');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar transações bancárias',
      });
    }
  });
};
