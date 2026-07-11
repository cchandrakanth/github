import type Database from 'better-sqlite3';
import * as Notifications from 'expo-notifications';
import { createTestDb } from '../helpers/db';
import { setDb } from '@/db/client';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as remindersRepo from '@/db/repositories/remindersRepo';
import * as notifications from '@/lib/notifications';
import { nextFireTime } from '@/lib/reminderTime';
import type { Reminder } from '@/db/schema';

const mocked = Notifications as jest.Mocked<typeof Notifications>;

let sqlite: Database.Database;

beforeEach(async () => {
  ({ sqlite } = await createTestDb());
  jest.clearAllMocks();
  mocked.scheduleNotificationAsync.mockImplementation(async () => `os-${mocked.scheduleNotificationAsync.mock.calls.length}`);
  mocked.getAllScheduledNotificationsAsync.mockResolvedValue([]);
});

afterEach(() => {
  setDb(null);
  sqlite.close();
});

async function makeNoteWithReminder(kind: 'once' | 'daily' | 'weekly', overrides: Partial<Reminder> = {}) {
  const note = await notesRepo.createNote();
  await notesRepo.updateNoteContent(note.id, { title: 'Take medicine', bodyHtml: '<p>with water</p>' });
  const base =
    kind === 'once'
      ? { atDatetime: Date.now() + 3_600_000 }
      : kind === 'daily'
        ? { timeOfDay: '07:30' }
        : { timeOfDay: '18:00', weekday: 1 };
  const reminder = await remindersRepo.createReminder({ noteId: note.id, kind, ...base });
  if (Object.keys(overrides).length) Object.assign(reminder, overrides);
  return { note: (await notesRepo.getNote(note.id))!, reminder };
}

describe('notification triggers (UT-3 / AC-2.1)', () => {
  it('daily reminders use a DAILY trigger at the chosen time', async () => {
    const { note, reminder } = await makeNoteWithReminder('daily');
    await notifications.schedule(reminder, note);
    const arg = mocked.scheduleNotificationAsync.mock.calls[0][0];
    expect(arg.trigger).toEqual({ type: 'daily', hour: 7, minute: 30 });
    expect(arg.content.title).toBe('Take medicine');
    expect(arg.content.body).toBe('with water');
    expect(arg.content.data).toEqual({ noteId: note.id });
  });

  it('weekly reminders map Monday(ours=1) to expo weekday 2', async () => {
    const { note, reminder } = await makeNoteWithReminder('weekly');
    await notifications.schedule(reminder, note);
    const arg = mocked.scheduleNotificationAsync.mock.calls[0][0];
    expect(arg.trigger).toEqual({ type: 'weekly', weekday: 2, hour: 18, minute: 0 });
    expect(notifications.toExpoWeekday(7)).toBe(1); // Sunday
    expect(notifications.toExpoWeekday(6)).toBe(7); // Saturday
  });

  it('once reminders use a DATE trigger', async () => {
    const { note, reminder } = await makeNoteWithReminder('once');
    await notifications.schedule(reminder, note);
    const arg = mocked.scheduleNotificationAsync.mock.calls[0][0];
    expect(arg.trigger).toEqual({ type: 'date', date: new Date(reminder.atDatetime!) });
  });
});

describe('reschedule (UT-5 / AC-3.3)', () => {
  it('cancels the old notification before scheduling the new one', async () => {
    const { note, reminder } = await makeNoteWithReminder('daily');
    const id = await notifications.reschedule(reminder, note, 'old-os-id');
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-os-id');
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(id).toBeTruthy();
  });
});

describe('nextFireTime (EC-5)', () => {
  const mkReminder = (over: Partial<Reminder>): Reminder => ({
    id: 'r',
    noteId: 'n',
    kind: 'weekly',
    atDatetime: null,
    timeOfDay: '09:00',
    weekday: 1,
    enabled: 1,
    notificationId: null,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  });

  it('weekly reminder set for earlier today schedules next week', () => {
    const mondayNoon = new Date('2026-07-13T12:00:00'); // a Monday
    const next = nextFireTime(mkReminder({ kind: 'weekly', weekday: 1, timeOfDay: '09:00' }), mondayNoon)!;
    expect(next.getDay()).toBe(1);
    expect(next.getTime() - mondayNoon.getTime()).toBeGreaterThan(6 * 24 * 3_600_000);
  });

  it('daily reminder earlier today rolls to tomorrow; later today stays today', () => {
    const noon = new Date('2026-07-13T12:00:00');
    expect(nextFireTime(mkReminder({ kind: 'daily', timeOfDay: '09:00', weekday: null }), noon)!.getDate()).toBe(14);
    expect(nextFireTime(mkReminder({ kind: 'daily', timeOfDay: '18:00', weekday: null }), noon)!.getDate()).toBe(13);
  });

  it('fired once reminders have no next fire time (AC-2.3)', () => {
    const now = new Date();
    expect(nextFireTime(mkReminder({ kind: 'once', atDatetime: now.getTime() - 1000, timeOfDay: null, weekday: null }), now)).toBeNull();
  });
});

describe('reconcile (UT-4 / AC-2.4, EC-1)', () => {
  it('re-schedules enabled reminders missing from the OS', async () => {
    const { reminder } = await makeNoteWithReminder('daily');
    await remindersRepo.setNotificationId(reminder.id, 'lost-after-reboot');
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    await notifications.reconcile();
    expect(mocked.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const row = await remindersRepo.getReminder(reminder.id);
    expect(row!.notificationId).not.toBe('lost-after-reboot');
    expect(row!.notificationId).toBeTruthy();
  });

  it('cancels orphaned OS schedules with no reminder row', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValue([{ identifier: 'orphan' } as any]);
    await notifications.reconcile();
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('orphan');
  });

  it('marks fired once-reminders and does not re-schedule them', async () => {
    const { reminder } = await makeNoteWithReminder('once');
    sqlite.prepare('UPDATE reminders SET at_datetime = ?, notification_id = ? WHERE id = ?').run(Date.now() - 1000, 'stale', reminder.id);
    await notifications.reconcile();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
    const row = await remindersRepo.getReminder(reminder.id);
    expect(row!.notificationId).toBeNull();
  });

  it('skips reminders of trashed notes (EC-4)', async () => {
    const { note } = await makeNoteWithReminder('daily');
    await notesRepo.softDeleteNote(note.id);
    await notifications.reconcile();
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
