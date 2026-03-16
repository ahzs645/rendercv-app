import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export function createDbClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const sql = postgres(process.env.DATABASE_URL);
  return drizzle(sql);
}
