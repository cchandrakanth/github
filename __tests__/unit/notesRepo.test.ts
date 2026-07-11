import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import * as notesRepo from '@/db/repositories/notesRepo';
import { setDb } from '@/db/client';

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

describe('notesRepo', () => {
  it('discardIfEmpty removes empty notes, keeps notes with content (UT-1 / AC-1.3)', async () => {
    const blank = await notesRepo.createNote();
    expect(await notesRepo.discardIfEmpty(blank.id)).toBe(true);
    expect(await notesRepo.getNote(blank.id)).toBeNull();

    const titled = await notesRepo.createNote();
    await notesRepo.updateNoteContent(titled.id, { title: 'keep' });
    expect(await notesRepo.discardIfEmpty(titled.id)).toBe(false);
    expect(await notesRepo.getNote(titled.id)).not.toBeNull();
  });

  it('updateNoteContent sanitizes html and regenerates body_text (AC-2.4, AC-2.5)', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { bodyHtml: '<p>hello</p><script>evil()</script>' });
    const saved = await notesRepo.getNote(note.id);
    expect(saved!.bodyHtml).toBe('<p>hello</p>');
    expect(saved!.bodyText).toBe('hello');
  });

  it('listNotes orders pinned-first then newest, excluding trash (UT-4 / AC-3.1)', async () => {
    const older = await notesRepo.createNote();
    await notesRepo.updateNoteContent(older.id, { title: 'older pinned' });
    await notesRepo.setPinned(older.id, true);
    const newer = await notesRepo.createNote();
    await notesRepo.updateNoteContent(newer.id, { title: 'newer' });
    const trashed = await notesRepo.createNote();
    await notesRepo.updateNoteContent(trashed.id, { title: 'gone' });
    await notesRepo.softDeleteNote(trashed.id);

    const list = await notesRepo.listNotes();
    expect(list.map((n) => n.title)).toEqual(['older pinned', 'newer']);
  });

  it('soft delete hides, restore returns, hard delete cascades (UT-5 / AC-4.1, AC-4.3)', async () => {
    const note = await notesRepo.createNote();
    await notesRepo.updateNoteContent(note.id, { title: 'with links' });
    const now = Date.now();
    sqlite.prepare("INSERT INTO tags (id, name, created_at) VALUES ('t1', 'urgent', ?)").run(now);
    sqlite.prepare("INSERT INTO note_tags (note_id, tag_id) VALUES (?, 't1')").run(note.id);
    sqlite
      .prepare(
        "INSERT INTO reminders (id, note_id, kind, time_of_day, enabled, notification_id, created_at, updated_at) VALUES ('r1', ?, 'daily', '07:30', 1, 'os-123', ?, ?)",
      )
      .run(note.id, now, now);

    const { cancelledNotificationIds } = await notesRepo.softDeleteNote(note.id);
    expect(cancelledNotificationIds).toEqual(['os-123']); // AC-4.4 hand-off
    expect((await notesRepo.listNotes()).length).toBe(0);
    expect((await notesRepo.listTrashedNotes()).map((n) => n.id)).toEqual([note.id]);
    // links survive trash (EC-3 of folders-tags)
    expect(sqlite.prepare('SELECT count(*) c FROM note_tags').get()).toEqual({ c: 1 });

    await notesRepo.restoreNote(note.id);
    expect((await notesRepo.listNotes()).length).toBe(1);

    await notesRepo.softDeleteNote(note.id);
    await notesRepo.hardDeleteNote(note.id);
    expect(sqlite.prepare('SELECT count(*) c FROM note_tags').get()).toEqual({ c: 0 });
    expect(sqlite.prepare('SELECT count(*) c FROM reminders').get()).toEqual({ c: 0 });
  });
});
