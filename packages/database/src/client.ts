import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema/index.js';


let globalClient: ReturnType<typeof postgres> | null = null;
let globalDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function createDbClient(connectionString?: string) {
  const url = connectionString || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required to connect to Postgres');
  }

  if (connectionString) {
    const client = postgres(connectionString, { prepare: false, max: 5 });
    return drizzle(client, { schema });
  }

  if (!globalDb) {
    globalClient = postgres(url, { prepare: false, max: 5 });
    globalDb = drizzle(globalClient, { schema });
  }

  return globalDb;
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

