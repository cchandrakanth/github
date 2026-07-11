import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from '@/db/schema';

// One Db type across drivers: expo-sqlite in the app ('async'), better-sqlite3 in Jest ('sync').
export type Db = BaseSQLiteDatabase<'async' | 'sync', any, typeof schema>;

let db: Db | null = null;

export function setDb(instance: Db | null): void {
  db = instance;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not initialized — call openAppDb() first');
  return db;
}

export async function openAppDb(): Promise<Db> {
  const { openDatabaseAsync } = await import('expo-sqlite');
  const { drizzle } = await import('drizzle-orm/expo-sqlite');
  const { runMigrations } = await import('@/db/migrations');

  const sqlite = await openDatabaseAsync('notes.db');
  await sqlite.execAsync('PRAGMA foreign_keys = ON');
  await runMigrations({
    execute: async (sql) => {
      await sqlite.execAsync(sql);
    },
    getUserVersion: async () => {
      const row = await sqlite.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      return row?.user_version ?? 0;
    },
    setUserVersion: async (v) => {
      await sqlite.execAsync(`PRAGMA user_version = ${v}`);
    },
  });
  const instance = drizzle(sqlite, { schema }) as unknown as Db;
  setDb(instance);
  return instance;
}
