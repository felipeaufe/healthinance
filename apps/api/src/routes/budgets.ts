import { FastifyPluginAsync } from 'fastify';
import {
  createDbClient,
  budgets,
  pluggyTransactions,
  eq,
  and,
  gte,
  lte,
  desc,
} from '@healthinance/database';
import {
  CreateBudgetSchema,
  UpdateBudgetSchema,
  BudgetsQuerySchema,
  BudgetWithConsumption,
  BudgetStatus,
} from '@healthinance/types';

function getDaysRemainingInMonth(year: number, month: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const lastDayOfMonth = new Date(year, month, 0).getDate();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 1;
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return lastDayOfMonth;
  }
  return Math.max(1, lastDayOfMonth - now.getDate() + 1);
}

export const budgetsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/budgets - Lista os orçamentos com consumo em tempo real e Safe to Spend
  fastify.get('/api/budgets', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    const queryResult = BudgetsQuerySchema.safeParse(request.query);

    const now = new Date();
    const periodMonth = queryResult.success && queryResult.data.month ? queryResult.data.month : now.getMonth() + 1;
    const periodYear = queryResult.success && queryResult.data.year ? queryResult.data.year : now.getFullYear();

    const db = createDbClient();

    try {
      // 1. Busca os orçamentos do usuário para o mês/ano
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, userId),
            eq(budgets.periodMonth, periodMonth),
            eq(budgets.periodYear, periodYear)
          )
        )
        .orderBy(desc(budgets.amount));

      // 2. Busca as transações de débito do usuário no mês selecionado
      const startOfMonth = new Date(periodYear, periodMonth - 1, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);

      const monthTransactions = await db
        .select({
          amount: pluggyTransactions.amount,
          category: pluggyTransactions.category,
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

      // 3. Agrupa os gastos por categoria
      const spentByCategory: Record<string, number> = {};
      for (const tx of monthTransactions) {
        const amountNum = Number(tx.amount) || 0;
        const isDebit = tx.type === 'DEBIT' || amountNum < 0;
        if (isDebit && tx.category) {
          const catKey = tx.category.toLowerCase().trim();
          spentByCategory[catKey] = (spentByCategory[catKey] || 0) + Math.abs(amountNum);
        }
      }

      // 4. Calcula métricas para cada orçamento
      const daysRemaining = getDaysRemainingInMonth(periodYear, periodMonth);
      let totalBudgeted = 0;
      let totalSpent = 0;

      const enrichedBudgets: BudgetWithConsumption[] = userBudgets.map((b) => {
        const budgetAmount = Number(b.amount) || 0;
        const catKey = b.category.toLowerCase().trim();
        const spent = Number((spentByCategory[catKey] || 0).toFixed(2));
        const remaining = Math.max(0, Number((budgetAmount - spent).toFixed(2)));
        const percentage = budgetAmount > 0 ? Number(((spent / budgetAmount) * 100).toFixed(1)) : 0;

        let status: BudgetStatus = 'normal';
        if (percentage > 90 || spent >= budgetAmount) {
          status = 'exceeded';
        } else if (percentage > 70) {
          status = 'warning';
        }

        const safeToSpendDaily =
          remaining > 0 && spent < budgetAmount
            ? Number((remaining / daysRemaining).toFixed(2))
            : 0;

        totalBudgeted += budgetAmount;
        totalSpent += spent;

        return {
          id: b.id,
          userId: b.userId,
          category: b.category,
          amount: budgetAmount,
          periodMonth: b.periodMonth,
          periodYear: b.periodYear,
          alertPercent: b.alertPercent,
          spent,
          remaining,
          percentage,
          status,
          safeToSpendDaily,
          daysRemaining,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      });

      return reply.send({
        success: true,
        data: {
          budgets: enrichedBudgets,
          totalBudgeted: Number(totalBudgeted.toFixed(2)),
          totalSpent: Number(totalSpent.toFixed(2)),
        },
      });
    } catch (error) {
      request.log.error(error, 'Erro ao buscar orçamentos');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao buscar orçamentos do usuário',
      });
    }
  });

  // POST /api/budgets - Cria um novo orçamento
  fastify.post('/api/budgets', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.sub;
    const bodyResult = CreateBudgetSchema.safeParse(request.body);

    if (!bodyResult.success) {
      return reply.status(400).send({
        success: false,
        error: bodyResult.error.errors[0]?.message || 'Dados inválidos para orçamento',
      });
    }

    const { category, amount, periodMonth, periodYear, alertPercent } = bodyResult.data;
    const db = createDbClient();

    try {
      // Verifica se já existe orçamento para esta categoria no mês
      const [existing] = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.userId, userId),
            eq(budgets.category, category),
            eq(budgets.periodMonth, periodMonth),
            eq(budgets.periodYear, periodYear)
          )
        );

      if (existing) {
        // Atualiza o existente
        const [updated] = await db
          .update(budgets)
          .set({
            amount: amount.toFixed(2),
            alertPercent: alertPercent ?? existing.alertPercent,
            updatedAt: new Date(),
          })
          .where(eq(budgets.id, existing.id))
          .returning();

        return reply.status(201).send({
          success: true,
          data: {
            ...updated,
            amount: Number(updated.amount),
          },
        });
      }

      // Cria novo orçamento
      const [newBudget] = await db
        .insert(budgets)
        .values({
          userId,
          category,
          amount: amount.toFixed(2),
          periodMonth,
          periodYear,
          alertPercent: alertPercent ?? 80,
        })
        .returning();

      return reply.status(201).send({
        success: true,
        data: {
          ...newBudget,
          amount: Number(newBudget.amount),
        },
      });
    } catch (error) {
      request.log.error(error, 'Erro ao criar orçamento');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao persistir orçamento',
      });
    }
  });

  // PUT /api/budgets/:id - Atualiza valor ou alerta do orçamento
  fastify.put<{ Params: { id: string } }>(
    '/api/budgets/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const bodyResult = UpdateBudgetSchema.safeParse(request.body);

      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: bodyResult.error.errors[0]?.message || 'Dados inválidos para atualização',
        });
      }

      const { amount, alertPercent } = bodyResult.data;
      const db = createDbClient();

      try {
        const updateData: Record<string, any> = {
          updatedAt: new Date(),
        };
        if (amount !== undefined) {
          updateData.amount = amount.toFixed(2);
        }
        if (alertPercent !== undefined) {
          updateData.alertPercent = alertPercent;
        }

        const [updated] = await db
          .update(budgets)
          .set(updateData)
          .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
          .returning();

        if (!updated) {
          return reply.status(404).send({
            success: false,
            error: 'Orçamento não encontrado',
          });
        }

        return reply.send({
          success: true,
          data: {
            ...updated,
            amount: Number(updated.amount),
          },
        });
      } catch (error) {
        request.log.error(error, 'Erro ao atualizar orçamento');
        return reply.status(500).send({
          success: false,
          error: 'Erro ao atualizar orçamento',
        });
      }
    }
  );

  // DELETE /api/budgets/:id - Exclui um orçamento
  fastify.delete<{ Params: { id: string } }>(
    '/api/budgets/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const db = createDbClient();

      try {
        const [deleted] = await db
          .delete(budgets)
          .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
          .returning();

        if (!deleted) {
          return reply.status(404).send({
            success: false,
            error: 'Orçamento não encontrado',
          });
        }

        return reply.send({
          success: true,
          message: 'Orçamento removido com sucesso',
        });
      } catch (error) {
        request.log.error(error, 'Erro ao remover orçamento');
        return reply.status(500).send({
          success: false,
          error: 'Erro ao remover orçamento',
        });
      }
    }
  );
};
