import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as tagsRepo from '@/db/repositories/tagsRepo';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

describe('tagsRepo', () => {
  it('findOrCreateTag reuses case-insensitive matches and strips # (UT-5 / AC-3.1, EC-2)', async () => {
    const first = await tagsRepo.findOrCreateTag('Urgent');
    const second = await tagsRepo.findOrCreateTag('#urgent');
    expect(second.id).toBe(first.id);
    expect(first.name).toBe('Urgent');
    expect(await tagsRepo.listTags()).toHaveLength(1);
  });

  it('setNoteTags replaces links atomically (UT-6 / AC-3.4)', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { title: 'n' });
    const urgent = await tagsRepo.findOrCreateTag('urgent');
    const shopping = await tagsRepo.findOrCreateTag('shopping');

    await tagsRepo.setNoteTags(note.id, [urgent.id, shopping.id]);
    expect((await tagsRepo.tagsForNote(note.id)).map((t) => t.name)).toEqual(['shopping', 'urgent']);

    await tagsRepo.setNoteTags(note.id, [shopping.id]);
    expect((await tagsRepo.tagsForNote(note.id)).map((t) => t.name)).toEqual(['shopping']);

    await tagsRepo.setNoteTags(note.id, []);
    expect(await tagsRepo.listNotesByTag(urgent.id)).toHaveLength(0);
  });

  it('listNotesByTag composes with folder filter and excludes trash (UT-6 / AC-3.5)', async () => {
    const work = await foldersRepo.createFolder('Work');
    const inWork = await notesRepo.createNote(work.id);
    await notesRepo.updateNoteContent(inWork.id, { title: 'work urgent' });
    const unfiled = await notesRepo.createNote();
    await notesRepo.updateNoteContent(unfiled.id, { title: 'home urgent' });
    const urgent = await tagsRepo.findOrCreateTag('urgent');
    await tagsRepo.setNoteTags(inWork.id, [urgent.id]);
    await tagsRepo.setNoteTags(unfiled.id, [urgent.id]);

    expect(await tagsRepo.listNotesByTag(urgent.id)).toHaveLength(2);
    expect((await tagsRepo.listNotesByTag(urgent.id, { folderId: work.id })).map((n) => n.title)).toEqual(['work urgent']);

    await notesRepo.softDeleteNote(unfiled.id);
    expect(await tagsRepo.listNotesByTag(urgent.id)).toHaveLength(1);
  });

  it('deleteTag removes it from all notes (AC-3.4)', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { title: 'n' });
    const tag = await tagsRepo.findOrCreateTag('temp');
    await tagsRepo.setNoteTags(note.id, [tag.id]);
    await tagsRepo.deleteTag(tag.id);
    expect(await tagsRepo.tagsForNote(note.id)).toHaveLength(0);
    expect(await tagsRepo.listTags()).toHaveLength(0);
  });
});
