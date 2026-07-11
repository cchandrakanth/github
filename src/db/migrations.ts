// Ordered migrations tracked via PRAGMA user_version. Each entry runs once,
// inside a transaction, on both expo-sqlite (app) and better-sqlite3 (tests).
export const migrations: string[][] = [
  [
    `CREATE TABLE folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX idx_folders_name ON folders(name COLLATE NOCASE)`,
    `CREATE TABLE notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      body_html TEXT NOT NULL DEFAULT '',
      body_text TEXT NOT NULL DEFAULT '',
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    )`,
    `CREATE INDEX idx_notes_folder_list ON notes(folder_id, deleted_at, pinned DESC, updated_at DESC)`,
    `CREATE INDEX idx_notes_list ON notes(deleted_at, updated_at DESC)`,
    `CREATE TABLE tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      created_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX idx_tags_name ON tags(name COLLATE NOCASE)`,
    `CREATE TABLE note_tags (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (note_id, tag_id)
    )`,
    `CREATE INDEX idx_note_tags_tag ON note_tags(tag_id, note_id)`,
    `CREATE TABLE reminders (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('once','daily','weekly')),
      at_datetime INTEGER,
      time_of_day TEXT,
      weekday INTEGER,
      enabled INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX idx_reminders_note ON reminders(note_id)`,
    `CREATE INDEX idx_reminders_enabled ON reminders(enabled, kind)`,
    `CREATE VIRTUAL TABLE notes_fts USING fts5(
      title,
      body_text,
      content='notes',
      content_rowid='rowid',
      tokenize='unicode61'
    )`,
    `CREATE TRIGGER notes_fts_insert AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, body_text) VALUES (new.rowid, new.title, new.body_text);
    END`,
    `CREATE TRIGGER notes_fts_delete AFTER DELETE ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, body_text) VALUES ('delete', old.rowid, old.title, old.body_text);
    END`,
    `CREATE TRIGGER notes_fts_update AFTER UPDATE OF title, body_text ON notes BEGIN
      INSERT INTO notes_fts(notes_fts, rowid, title, body_text) VALUES ('delete', old.rowid, old.title, old.body_text);
      INSERT INTO notes_fts(rowid, title, body_text) VALUES (new.rowid, new.title, new.body_text);
    END`,
  ],
];

export interface SqlExecutor {
  execute(sql: string): void | Promise<void>;
  getUserVersion(): number | Promise<number>;
  setUserVersion(v: number): void | Promise<void>;
}

export async function runMigrations(executor: SqlExecutor, migs: string[][] = migrations): Promise<void> {
  const current = await executor.getUserVersion();
  for (let v = current; v < migs.length; v++) {
    await executor.execute('BEGIN');
    try {
      for (const stmt of migs[v]) await executor.execute(stmt);
      await executor.setUserVersion(v + 1);
      await executor.execute('COMMIT');
    } catch (e) {
      await executor.execute('ROLLBACK');
      throw e;
    }
  }
}
