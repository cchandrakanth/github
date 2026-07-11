import type Database from 'better-sqlite3';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as remindersRepo from '@/db/repositories/remindersRepo';
import * as notesRepo from '@/db/repositories/notesRepo';
import { ValidationError } from '@/lib/errors';

let sqlite: Database.Database;
let noteId: string;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
  const note = await notesRepo.createNote();
  await notesRepo.updateNoteContent(note.id, { title: 'routine' });
  noteId = note.id;
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

describe('remindersRepo', () => {
  it('rejects past once-reminders and invalid shapes (UT-1 / AC-1.5)', async () => {
    const now = Date.now();
    await expect(remindersRepo.createReminder({ noteId, kind: 'once', atDatetime: now - 3_600_000 }, now)).rejects.toBeInstanceOf(ValidationError);
    await expect(remindersRepo.createReminder({ noteId, kind: 'weekly', timeOfDay: '18:00' }, now)).rejects.toBeInstanceOf(ValidationError);
    await expect(remindersRepo.createReminder({ noteId, kind: 'daily', timeOfDay: '25:00' }, now)).rejects.toBeInstanceOf(ValidationError);
    await expect(remindersRepo.createReminder({ noteId, kind: 'once', atDatetime: now + 60_000 }, now)).resolves.toBeDefined();
  });

  it('stores multiple reminders per note with notification ids (UT-2 / AC-1.3, AC-1.4)', async () => {
    const daily = await remindersRepo.createReminder({ noteId, kind: 'daily', timeOfDay: '08:00' });
    const weekly = await remindersRepo.createReminder({ noteId, kind: 'weekly', timeOfDay: '20:00', weekday: 7 });
    await remindersRepo.setNotificationId(daily.id, 'os-1');
    await remindersRepo.setNotificationId(weekly.id, 'os-2');
    const list = await remindersRepo.listByNote(noteId);
    expect(list).toHaveLength(2);
    expect(list.map((r) => r.notificationId).sort()).toEqual(['os-1', 'os-2']);
  });

  it('setEnabled pauses keeping config, resume stores new id (AC-3.2)', async () => {
    const r = await remindersRepo.createReminder({ noteId, kind: 'daily', timeOfDay: '07:30' });
    await remindersRepo.setNotificationId(r.id, 'os-1');
    await remindersRepo.setEnabled(r.id, false, null);
    let row = await remindersRepo.getReminder(r.id);
    expect(row!.enabled).toBe(0);
    expect(row!.notificationId).toBeNull();
    expect(row!.timeOfDay).toBe('07:30');
    await remindersRepo.setEnabled(r.id, true, 'os-2');
    row = await remindersRepo.getReminder(r.id);
    expect(row!.enabled).toBe(1);
    expect(row!.notificationId).toBe('os-2');
  });
});
