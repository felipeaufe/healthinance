import {
  createDbClient,
  pluggyTransactions,
  pluggyAccounts,
  pluggyItems,
  eq,
  and,
  gte,
  lte,
  desc,
} from "@healthinance/database";

export interface DashboardTransaction {
  id: string;
  accountId: string;
  userId: string;
  description: string;
  amount: number;
  date: Date;
  category: string | null;
  type: string;
  status: string | null;
  accountName: string | null;
  bankName: string | null;
}

export interface MonthlySummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  netBalance: number;
  transactionsCount: number;
}

export async function getUserTransactions(
  userId: string,
  limit = 20
): Promise<{
  transactions: DashboardTransaction[];
  summary: MonthlySummary;
}> {
  try {
    const db = createDbClient();

    // 1. Busca transações recentes ordenadas por data
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
        accountName: pluggyAccounts.name,
        bankName: pluggyItems.connectorName,
      })
      .from(pluggyTransactions)
      .leftJoin(pluggyAccounts, eq(pluggyTransactions.accountId, pluggyAccounts.id))
      .leftJoin(pluggyItems, eq(pluggyAccounts.itemId, pluggyItems.id))
      .where(eq(pluggyTransactions.userId, userId))
      .orderBy(desc(pluggyTransactions.date))
      .limit(limit);

    const transactions: DashboardTransaction[] = rows.map((tx) => ({
      ...tx,
      amount: Number(tx.amount) || 0,
      date: new Date(tx.date),
    }));

    // 2. Calcula indicadores do mês corrente
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
      if (row.type === "CREDIT" || Number(row.amount) > 0) {
        monthlyIncome += num;
      } else {
        monthlyExpenses += num;
      }
    }

    return {
      transactions,
      summary: {
        monthlyIncome,
        monthlyExpenses,
        netBalance: monthlyIncome - monthlyExpenses,
        transactionsCount: monthRows.length,
      },
    };
  } catch (error) {
    console.error("Erro ao consultar transações do usuário:", error);
    return {
      transactions: [],
      summary: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netBalance: 0,
        transactionsCount: 0,
      },
    };
  }
}
