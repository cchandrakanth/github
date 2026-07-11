import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import { escapeFtsQuery, searchNotes } from '@/db/repositories/searchRepo';

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

async function seedNote(title: string, body: string, folderId?: string) {
  const n = await notesRepo.createNote(folderId ?? null);
  await notesRepo.updateNoteContent(n.id, { title, bodyHtml: `<p>${body}</p>` });
  return n;
}

describe('searchRepo', () => {
  it('matches prefixes case-insensitively across title and body (UT-1 / AC-1.2)', async () => {
    await seedNote('Groceries', 'buy milk');
    expect((await searchNotes('groc')).map((r) => r.title)).toEqual(['Groceries']);
    expect((await searchNotes('MILK')).map((r) => r.title)).toEqual(['Groceries']);
  });

  it('excludes trashed and hard-deleted notes (UT-2 / AC-1.4)', async () => {
    const n = await seedNote('Groceries', 'buy milk');
    await notesRepo.softDeleteNote(n.id);
    expect(await searchNotes('milk')).toEqual([]);
    await notesRepo.hardDeleteNote(n.id);
    expect(await searchNotes('milk')).toEqual([]);
  });

  it('ranks title matches above body-only matches (UT-3 / AC-2.2)', async () => {
    await seedNote('Household chores', 'plan the budget for groceries and utilities');
    await seedNote('Budget', 'monthly overview');
    const results = await searchNotes('budget');
    expect(results.map((r) => r.title)).toEqual(['Budget', 'Household chores']);
  });

  it('treats FTS operator characters as literals without throwing (UT-4 / EC-1)', async () => {
    await seedNote('Notes', 'a AND b');
    await expect(searchNotes('"')).resolves.toBeDefined();
    await expect(searchNotes('note-*')).resolves.toBeDefined();
    const results = await searchNotes('a AND b');
    expect(results).toHaveLength(1); // AND treated as a literal term, present in body
    expect(await searchNotes('   ')).toEqual([]);
  });

  it('reflects note edits through trigger sync (UT-5 / EC-3)', async () => {
    const n = await seedNote('Travel', 'pack bags');
    expect(await searchNotes('zanzibar')).toEqual([]);
    await notesRepo.updateNoteContent(n.id, { bodyHtml: '<p>fly to zanzibar</p>' });
    expect((await searchNotes('zanzibar')).map((r) => r.title)).toEqual(['Travel']);
  });

  it('finds non-latin content (UT-6 / EC-4)', async () => {
    await seedNote('Greeting', 'привет мир');
    expect((await searchNotes('привет')).map((r) => r.title)).toEqual(['Greeting']);
  });

  it('returns highlighted snippets and folder names (AC-2.1, AC-2.4)', async () => {
    const folder = await foldersRepo.createFolder('Home');
    await seedNote('Groceries', 'remember to buy oat milk today', folder.id);
    const [r] = await searchNotes('oat');
    expect(r.snippet).toContain('⟪oat⟫');
    expect(r.folderName).toBe('Home');
  });

  it('escapeFtsQuery quotes terms and adds prefix stars', () => {
    expect(escapeFtsQuery('hello world')).toBe('"hello"* "world"*');
    expect(escapeFtsQuery('say "hi"')).toBe('"say"* """hi"""*');
    expect(escapeFtsQuery('  ')).toBe('');
  });

  it('stays under the latency target with 10k notes (PERF-1 / AC-1.3)', async () => {
    const insert = sqlite.prepare(
      "INSERT INTO notes (id, title, body_html, body_text, pinned, created_at, updated_at) VALUES (?, ?, '', ?, 0, 1, 1)",
    );
    const tx = sqlite.transaction(() => {
      for (let i = 0; i < 10_000; i++) {
        insert.run(`bulk-${i}`, `Note ${i}`, `content item ${i} ${i % 100 === 0 ? 'needle' : 'hay'}`);
      }
    });
    tx();
    const start = Date.now();
    const results = await searchNotes('needle');
    const elapsed = Date.now() - start;
    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(200);
  });
});
