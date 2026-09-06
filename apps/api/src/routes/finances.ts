import { FastifyPluginAsync } from 'fastify';
import { createDbClient, pluggyAccounts, pluggyItems, pluggyTransactions, eq, desc } from '@healthinance/database';

export const financeRoutes: FastifyPluginAsync = async (fastify) => {
  // Lista contas bancárias do usuário com dados da instituição conectada e totais consolidados
  fastify.get('/api/accounts', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    const db = createDbClient();

    try {
      const rows = await db
        .select({
          id: pluggyAccounts.id,
          itemId: pluggyAccounts.itemId,
          userId: pluggyAccounts.userId,
          type: pluggyAccounts.type,
          subtype: pluggyAccounts.subtype,
          name: pluggyAccounts.name,
          balance: pluggyAccounts.balance,
          currencyCode: pluggyAccounts.currencyCode,
          number: pluggyAccounts.number,
          createdAt: pluggyAccounts.createdAt,
          updatedAt: pluggyAccounts.updatedAt,
          connectorName: pluggyItems.connectorName,
          connectorId: pluggyItems.connectorId,
        })
        .from(pluggyAccounts)
        .leftJoin(pluggyItems, eq(pluggyAccounts.itemId, pluggyItems.id))
        .where(eq(pluggyAccounts.userId, userId));

      const accounts = rows.map((acc) => ({
        ...acc,
        balance: Number(acc.balance) || 0,
      }));

      // Calcula saldo consolidado e contagem de instituições
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      const uniqueInstitutions = new Set(
        rows.map((acc) => acc.connectorName).filter(Boolean)
      );
      const institutionsCount = uniqueInstitutions.size;

      return reply.send({
        success: true,
        data: {
          accounts,
          totalBalance,
          institutionsCount,
        },
      });
    } catch (error) {
      request.log.error(error, 'Erro ao buscar contas');
      const message = error instanceof Error ? error.message : 'Erro ao buscar contas bancárias';
      return reply.status(500).send({
        success: false,
        error: message,
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
