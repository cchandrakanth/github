import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';
import { DuplicateNameError, ValidationError } from '@/lib/errors';

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

describe('foldersRepo', () => {
  it('trims names, rejects empty and case-insensitive duplicates (UT-1 / AC-1.1)', async () => {
    const folder = await foldersRepo.createFolder('  Work  ');
    expect(folder.name).toBe('Work');
    await expect(foldersRepo.createFolder('work')).rejects.toBeInstanceOf(DuplicateNameError);
    await expect(foldersRepo.createFolder('   ')).rejects.toBeInstanceOf(ValidationError);
    await expect(foldersRepo.renameFolder(folder.id, 'Work')).resolves.toBeUndefined(); // rename to own name ok
  });

  it('persists manual reorder (UT-2 / AC-1.2)', async () => {
    const a = await foldersRepo.createFolder('A');
    const b = await foldersRepo.createFolder('B');
    const c = await foldersRepo.createFolder('C');
    await foldersRepo.reorderFolders([c.id, a.id, b.id]);
    const list = await foldersRepo.listFoldersWithCounts();
    expect(list.map((f) => f.name)).toEqual(['C', 'A', 'B']);
  });

  it('deleting a folder moves notes to Unfiled, never deletes them (UT-3 / AC-1.3)', async () => {
    const folder = await foldersRepo.createFolder('Work');
    const n1 = await notesRepo.createNote(folder.id);
    await notesRepo.updateNoteContent(n1.id, { title: 'one' });
    const n2 = await notesRepo.createNote(folder.id);
    await notesRepo.updateNoteContent(n2.id, { title: 'two' });

    await foldersRepo.deleteFolder(folder.id);
    const all = await notesRepo.listNotes();
    expect(all).toHaveLength(2);
    expect(all.every((n) => n.folderId === null)).toBe(true);
    expect(await foldersRepo.countUnfiled()).toBe(2);
  });

  it('counts exclude trashed notes (UT-4 / AC-1.4, EC-3)', async () => {
    const folder = await foldersRepo.createFolder('Work');
    for (const t of ['a', 'b', 'c']) {
      const n = await notesRepo.createNote(folder.id);
      await notesRepo.updateNoteContent(n.id, { title: t });
    }
    const [first] = await notesRepo.listNotes({ folderId: folder.id });
    await notesRepo.softDeleteNote(first.id);
    const list = await foldersRepo.listFoldersWithCounts();
    expect(list[0].liveNoteCount).toBe(2);
  });
});
