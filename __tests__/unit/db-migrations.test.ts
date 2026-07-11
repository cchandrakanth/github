import Database from 'better-sqlite3';
import { migrations } from '@/db/migrations';
import { makeExecutor, runMigrations } from '../helpers/db';

function tableNames(sqlite: Database.Database): string[] {
  return sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name")
    .all()
    .map((r: any) => r.name);
}

describe('database migrations', () => {
  it('creates all v1 tables on a fresh database (UT-2 / AC-2.1)', async () => {
    const sqlite = new Database(':memory:');
    await runMigrations(makeExecutor(sqlite));
    const names = tableNames(sqlite);
    for (const t of ['notes', 'folders', 'tags', 'note_tags', 'reminders', 'notes_fts']) {
      expect(names).toContain(t);
    }
    sqlite.close();
  });

  it('re-running migrations is a no-op that preserves data (UT-3 / AC-2.2)', async () => {
    const sqlite = new Database(':memory:');
    await runMigrations(makeExecutor(sqlite));
    sqlite
      .prepare("INSERT INTO notes (id, title, created_at, updated_at) VALUES ('n1', 'keep me', 1, 1)")
      .run();
    await runMigrations(makeExecutor(sqlite));
    const row = sqlite.prepare("SELECT title FROM notes WHERE id = 'n1'").get() as any;
    expect(row.title).toBe('keep me');
    sqlite.close();
  });

  it('rolls back atomically when a migration fails (EC-2)', async () => {
    const sqlite = new Database(':memory:');
    const executor = makeExecutor(sqlite);
    await runMigrations(executor);
    const broken = [...migrations, ['CREATE TABLE ok (id TEXT)', 'THIS IS NOT SQL']];
    await expect(runMigrations(executor, broken)).rejects.toThrow();
    expect(tableNames(sqlite)).not.toContain('ok'); // partial migration rolled back
    expect(sqlite.pragma('user_version', { simple: true })).toBe(migrations.length);
    sqlite.close();
  });

  it('FTS triggers keep notes_fts in sync on insert/update/delete', async () => {
    const sqlite = new Database(':memory:');
    await runMigrations(makeExecutor(sqlite));
    sqlite
      .prepare("INSERT INTO notes (id, title, body_text, created_at, updated_at) VALUES ('n1', 'Groceries', 'buy milk', 1, 1)")
      .run();
    const hit = () =>
      sqlite.prepare("SELECT count(*) c FROM notes_fts WHERE notes_fts MATCH 'milk'").get() as any;
    expect(hit().c).toBe(1);
    sqlite.prepare("UPDATE notes SET body_text = 'buy bread' WHERE id = 'n1'").run();
    expect(hit().c).toBe(0);
    sqlite.prepare("DELETE FROM notes WHERE id = 'n1'").run();
    expect(
      (sqlite.prepare("SELECT count(*) c FROM notes_fts WHERE notes_fts MATCH 'bread'").get() as any).c,
    ).toBe(0);
    sqlite.close();
  });
});
