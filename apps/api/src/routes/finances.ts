import { FastifyPluginAsync } from 'fastify';
import {
  createDbClient,
  pluggyAccounts,
  pluggyItems,
  pluggyTransactions,
  eq,
  and,
  gte,
  lte,
  desc,
  count,
} from '@healthinance/database';

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

  // Lista transações do usuário com filtros, paginação e resumo mensal
  fastify.get<{
    Querystring: {
      accountId?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
      page?: string;
    };
  }>(
    '/api/transactions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { accountId, startDate, endDate, limit: limitParam, page: pageParam } = request.query;

      const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100);
      const page = Math.max(Number(pageParam) || 1, 1);
      const offset = (page - 1) * limit;

      const db = createDbClient();

      try {
        const conditions = [eq(pluggyTransactions.userId, userId)];

        if (accountId) {
          conditions.push(eq(pluggyTransactions.accountId, accountId));
        }
        if (startDate) {
          conditions.push(gte(pluggyTransactions.date, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lte(pluggyTransactions.date, new Date(endDate)));
        }

        const whereClause = and(...conditions);

        // Contagem total de transações
        const [totalResult] = await db
          .select({ total: count() })
          .from(pluggyTransactions)
          .where(whereClause);
        const total = Number(totalResult?.total) || 0;

        // Consulta de transações paginadas com joins
        const rows = await db
          .select({
            id: pluggyTransactions.id,
            accountId: pluggyTransactions.accountId,
            userId: pluggyTransactions.userId,
            description: pluggyTransactions.description,
            amount: pluggyTransactions.amount,
            date: pluggyTransactions.date,
            category: pluggyTransactions.category,
            type: pluggyTransactions.type,
            status: pluggyTransactions.status,
            createdAt: pluggyTransactions.createdAt,
            accountName: pluggyAccounts.name,
            accountType: pluggyAccounts.type,
            bankName: pluggyItems.connectorName,
          })
          .from(pluggyTransactions)
          .leftJoin(pluggyAccounts, eq(pluggyTransactions.accountId, pluggyAccounts.id))
          .leftJoin(pluggyItems, eq(pluggyAccounts.itemId, pluggyItems.id))
          .where(whereClause)
          .orderBy(desc(pluggyTransactions.date))
          .limit(limit)
          .offset(offset);

        const transactions = rows.map((tx) => ({
          ...tx,
          amount: Number(tx.amount) || 0,
        }));

        // Resumo financeiro do mês corrente
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthRows = await db
          .select({
            amount: pluggyTransactions.amount,
            type: pluggyTransactions.type,
          })
          .from(pluggyTransactions)
          .where(
            and(
              eq(pluggyTransactions.userId, userId),
              gte(pluggyTransactions.date, startOfMonth),
              lte(pluggyTransactions.date, endOfMonth)
            )
          );

        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        for (const row of monthRows) {
          const num = Math.abs(Number(row.amount) || 0);
          if (row.type === 'CREDIT' || Number(row.amount) > 0) {
            monthlyIncome += num;
          } else {
            monthlyExpenses += num;
          }
        }

        const summary = {
          monthlyIncome,
          monthlyExpenses,
          netBalance: monthlyIncome - monthlyExpenses,
          transactionsCount: monthRows.length,
        };

        return reply.send({
          success: true,
          data: {
            transactions,
            total,
            page,
            limit,
            summary,
          },
        });
      } catch (error) {
        request.log.error(error, 'Erro ao buscar transações');
        return reply.status(500).send({
          success: false,
          error: 'Erro ao buscar transações bancárias',
        });
      }
    }
  );
};
