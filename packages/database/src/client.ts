import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema/index.js';


export function createDbClient(connectionString?: string) {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required to connect to Postgres');
  }

  // Desativa prepared statements para compatibilidade com o Transaction Pooler do Supabase (porta 6543)
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDbClient>;

export interface ConnectionHealthResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export async function checkDatabaseConnection(dbClient?: Database): Promise<ConnectionHealthResult> {
  const start = Date.now();
  try {
    const db = dbClient || createDbClient();
    await db.execute(sql`SELECT 1`);
    return {
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

