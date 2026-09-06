import { PluggyClient } from 'pluggy-sdk';
import { createDbClient, pluggyItems, pluggyAccounts, pluggyTransactions } from '@healthinance/database';
import { eq } from '@healthinance/database';

let pluggyClientInstance: PluggyClient | null = null;

export function getPluggyClient(): PluggyClient {
  if (!pluggyClientInstance) {
    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET devem estar configurados nas variáveis de ambiente.');
    }

    pluggyClientInstance = new PluggyClient({
      clientId,
      clientSecret,
    });
  }
  return pluggyClientInstance;
}

export interface PluggyHealthResult {
  ok: boolean;
  latencyMs: number;
  connectorsCount?: number;
  error?: string;
}

export async function checkPluggyConnection(): Promise<PluggyHealthResult> {
  const start = Date.now();
  try {
    const client = getPluggyClient();
    const connectors = await client.fetchConnectors({ sandbox: true });
    return {
      ok: true,
      latencyMs: Date.now() - start,
      connectorsCount: connectors.results?.length ?? 0,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}


export async function createConnectToken(clientUserId?: string): Promise<string> {
  const client = getPluggyClient();
  const rawWebhookUrl = process.env.PLUGGY_WEBHOOK_URL;
  // Pluggy API exige estritamente HTTPS para URLs de webhook
  const webhookUrl = rawWebhookUrl && rawWebhookUrl.startsWith('https://') ? rawWebhookUrl : undefined;

  const data = await client.createConnectToken(undefined, {
    clientUserId,
    webhookUrl,
  });

  return data.accessToken;
}


export async function syncItemData(itemId: string, userId: string): Promise<{ itemId: string; status: string }> {
  const client = getPluggyClient();
  const db = createDbClient();

  // 1. Busca dados atualizados do Item na Pluggy
  const item = await client.fetchItem(itemId);

  await db
    .insert(pluggyItems)
    .values({
      id: item.id,
      userId,
      connectorId: item.connector.id,
      connectorName: item.connector.name,
      status: item.status,
      errorCode: item.error ? item.error.code : null,
      errorMessage: item.error ? item.error.message : null,
      lastUpdatedAt: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : new Date(),
    })
    .onConflictDoUpdate({
      target: pluggyItems.id,
      set: {
        status: item.status,
        errorCode: item.error ? item.error.code : null,
        errorMessage: item.error ? item.error.message : null,
        lastUpdatedAt: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : new Date(),
      },
    });

  // 2. Busca e sincroniza as contas bancárias associadas
  const accountsResponse = await client.fetchAccounts(itemId);
  for (const acc of accountsResponse.results) {
    await db
      .insert(pluggyAccounts)
      .values({
        id: acc.id,
        itemId: acc.itemId,
        userId,
        type: acc.type,
        subtype: acc.subtype,
        name: acc.name,
        balance: String(acc.balance),
        currencyCode: acc.currencyCode,
        number: acc.number,
      })
      .onConflictDoUpdate({
        target: pluggyAccounts.id,
        set: {
          name: acc.name,
          balance: String(acc.balance),
          updatedAt: new Date(),
        },
      });

    // 3. Busca e sincroniza transações recentes da conta
    try {
      const transactionsResponse = await client.fetchTransactions(acc.id);
      for (const tx of transactionsResponse.results) {
        await db
          .insert(pluggyTransactions)
          .values({
            id: tx.id,
            accountId: acc.id,
            userId,
            description: tx.description,
            amount: String(tx.amount),
            date: new Date(tx.date),
            category: tx.category,
            type: tx.type,
            status: tx.status,
          })
          .onConflictDoNothing({
            target: pluggyTransactions.id,
          });
      }
    } catch (txError) {
      console.error(`Erro ao sincronizar transações para a conta ${acc.id}:`, txError);
    }
  }

  return { itemId: item.id, status: item.status };
}

