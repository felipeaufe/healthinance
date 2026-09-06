import { createDbClient, pluggyAccounts, pluggyItems, eq } from '@healthinance/database';

export interface DashboardAccount {
  id: string;
  itemId: string;
  userId: string;
  type: string;
  subtype: string | null;
  name: string;
  balance: number;
  currencyCode: string;
  number: string | null;
  connectorName: string | null;
  connectorId: number | null;
}

export async function getUserAccounts(userId: string): Promise<{
  accounts: DashboardAccount[];
  totalBalance: number;
  institutionsCount: number;
}> {
  try {
    const db = createDbClient();

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
        connectorName: pluggyItems.connectorName,
        connectorId: pluggyItems.connectorId,
      })
      .from(pluggyAccounts)
      .leftJoin(pluggyItems, eq(pluggyAccounts.itemId, pluggyItems.id))
      .where(eq(pluggyAccounts.userId, userId));

    const accounts: DashboardAccount[] = rows.map((acc) => ({
      ...acc,
      balance: Number(acc.balance) || 0,
    }));

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const uniqueInstitutions = new Set(
      rows.map((acc) => acc.connectorName).filter(Boolean)
    );

    return {
      accounts,
      totalBalance,
      institutionsCount: uniqueInstitutions.size,
    };
  } catch (error) {
    console.error('Erro ao consultar contas do usuário:', error);
    return {
      accounts: [],
      totalBalance: 0,
      institutionsCount: 0,
    };
  }
}
