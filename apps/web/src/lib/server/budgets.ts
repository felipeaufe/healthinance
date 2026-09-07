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
import { BudgetWithConsumption, BudgetStatus } from '@healthinance/types';

function getDaysRemainingInMonth(year: number, month: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const lastDayOfMonth = new Date(year, month, 0).getDate();

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 1;
  }
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return lastDayOfMonth;
  }
  return Math.max(1, lastDayOfMonth - now.getDate() + 1);
}

export async function getUserBudgets(
  userId: string,
  month?: number,
  year?: number
): Promise<{
  budgets: BudgetWithConsumption[];
  totalBudgeted: number;
  totalSpent: number;
}> {
  try {
    const db = createDbClient();
    const now = new Date();
    const periodMonth = month ?? now.getMonth() + 1;
    const periodYear = year ?? now.getFullYear();

    // 1. Busca os orçamentos definidos
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

    // 2. Busca gastos de débito do mês
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

    // 3. Agrupa gastos por categoria
    const spentByCategory: Record<string, number> = {};
    for (const tx of monthTransactions) {
      const amountNum = Number(tx.amount) || 0;
      const isDebit = tx.type === 'DEBIT' || amountNum < 0;
      if (isDebit && tx.category) {
        const catKey = tx.category.toLowerCase().trim();
        spentByCategory[catKey] = (spentByCategory[catKey] || 0) + Math.abs(amountNum);
      }
    }

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

    return {
      budgets: enrichedBudgets,
      totalBudgeted: Number(totalBudgeted.toFixed(2)),
      totalSpent: Number(totalSpent.toFixed(2)),
    };
  } catch (error) {
    console.error('Erro ao buscar orçamentos no servidor:', error);
    return {
      budgets: [],
      totalBudgeted: 0,
      totalSpent: 0,
    };
  }
}
