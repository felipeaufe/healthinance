import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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
