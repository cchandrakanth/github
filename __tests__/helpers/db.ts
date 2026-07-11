import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrations, runMigrations, type SqlExecutor } from '@/db/migrations';
import { setDb, type Db } from '@/db/client';
import * as schema from '@/db/schema';

export function makeExecutor(sqlite: Database.Database): SqlExecutor {
  return {
    execute: (sql) => {
      sqlite.exec(sql);
    },
    getUserVersion: () => sqlite.pragma('user_version', { simple: true }) as number,
    setUserVersion: (v) => {
      sqlite.pragma(`user_version = ${v}`);
    },
  };
}

// In-memory database with the full app schema, registered as the active Db.
export async function createTestDb(): Promise<{ db: Db; sqlite: Database.Database }> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  await runMigrations(makeExecutor(sqlite));
  const db = drizzle(sqlite, { schema }) as unknown as Db;
  setDb(db);
  return { db, sqlite };
}

export { migrations, runMigrations };
