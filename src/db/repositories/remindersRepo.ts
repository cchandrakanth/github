import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { reminders, type Reminder, type ReminderKind } from '@/db/schema';
import { newId } from '@/lib/id';
import { ValidationError } from '@/lib/errors';

export interface ReminderInput {
  noteId: string;
  kind: ReminderKind;
  atDatetime?: number | null; // once
  timeOfDay?: string | null; // daily/weekly 'HH:mm'
  weekday?: number | null; // weekly 1=Mon..7=Sun
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function validate(input: ReminderInput, now: number): void {
  if (input.kind === 'once') {
    if (!input.atDatetime) throw new ValidationError('Pick a date and time');
    if (input.atDatetime <= now) throw new ValidationError('Reminder time must be in the future');
  } else {
    if (!input.timeOfDay || !TIME_RE.test(input.timeOfDay)) throw new ValidationError('Pick a valid time (HH:mm)');
    if (input.kind === 'weekly') {
      if (!input.weekday || input.weekday < 1 || input.weekday > 7) throw new ValidationError('Pick a weekday');
    }
  }
}

export async function createReminder(input: ReminderInput, now: number = Date.now()): Promise<Reminder> {
  validate(input, now);
  const reminder: Reminder = {
    id: newId(),
    noteId: input.noteId,
    kind: input.kind,
    atDatetime: input.kind === 'once' ? input.atDatetime! : null,
    timeOfDay: input.kind === 'once' ? null : input.timeOfDay!,
    weekday: input.kind === 'weekly' ? input.weekday! : null,
    enabled: 1,
    notificationId: null,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(reminders).values(reminder);
  return reminder;
}

export async function updateReminderSchedule(id: string, input: Omit<ReminderInput, 'noteId'>, now: number = Date.now()): Promise<Reminder> {
  const existing = await getReminder(id);
  if (!existing) throw new ValidationError('Reminder not found');
  validate({ ...input, noteId: existing.noteId }, now);
  const values = {
    kind: input.kind,
    atDatetime: input.kind === 'once' ? input.atDatetime! : null,
    timeOfDay: input.kind === 'once' ? null : input.timeOfDay!,
    weekday: input.kind === 'weekly' ? input.weekday! : null,
    updatedAt: now,
  };
  await getDb().update(reminders).set(values).where(eq(reminders.id, id));
  return { ...existing, ...values };
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const rows = await getDb().select().from(reminders).where(eq(reminders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function setEnabled(id: string, enabled: boolean, notificationId: string | null): Promise<void> {
  await getDb()
    .update(reminders)
    .set({ enabled: enabled ? 1 : 0, notificationId, updatedAt: Date.now() })
    .where(eq(reminders.id, id));
}

export async function setNotificationId(id: string, notificationId: string | null): Promise<void> {
  await getDb().update(reminders).set({ notificationId, updatedAt: Date.now() }).where(eq(reminders.id, id));
}

export async function deleteReminder(id: string): Promise<void> {
  await getDb().delete(reminders).where(eq(reminders.id, id));
}

export async function listByNote(noteId: string): Promise<Reminder[]> {
  return getDb().select().from(reminders).where(eq(reminders.noteId, noteId)).orderBy(asc(reminders.createdAt));
}

export async function listAll(): Promise<Reminder[]> {
  return getDb().select().from(reminders).orderBy(asc(reminders.createdAt));
}
