import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { notes, noteTags, reminders, type Note } from '@/db/schema';
import { newId } from '@/lib/id';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { htmlToText } from '@/lib/htmlToText';

export async function createNote(folderId?: string | null): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: newId(),
    title: '',
    bodyHtml: '',
    bodyText: '',
    folderId: folderId ?? null,
    pinned: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await getDb().insert(notes).values(note);
  return note;
}

export async function getNote(id: string): Promise<Note | null> {
  const rows = await getDb().select().from(notes).where(eq(notes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateNoteContent(id: string, patch: { title?: string; bodyHtml?: string }): Promise<void> {
  const values: Partial<Note> = { updatedAt: Date.now() };
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.bodyHtml !== undefined) {
    const clean = sanitizeHtml(patch.bodyHtml);
    values.bodyHtml = clean;
    values.bodyText = htmlToText(clean);
  }
  await getDb().update(notes).set(values).where(eq(notes.id, id));
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  await getDb().update(notes).set({ pinned: pinned ? 1 : 0, updatedAt: Date.now() }).where(eq(notes.id, id));
}

export async function setFolder(id: string, folderId: string | null): Promise<void> {
  await getDb().update(notes).set({ folderId, updatedAt: Date.now() }).where(eq(notes.id, id));
}

export async function listNotes(filter?: { folderId?: string | null }): Promise<Note[]> {
  const conds = [isNull(notes.deletedAt)];
  if (filter && filter.folderId !== undefined) {
    conds.push(filter.folderId === null ? isNull(notes.folderId) : eq(notes.folderId, filter.folderId));
  }
  return getDb()
    .select()
    .from(notes)
    .where(and(...conds))
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
}

export async function listTrashedNotes(): Promise<Note[]> {
  return getDb().select().from(notes).where(isNotNull(notes.deletedAt)).orderBy(desc(notes.deletedAt));
}

// Returns notification ids the caller must cancel (AC-4.4); ids are cleared on the rows.
export async function softDeleteNote(id: string): Promise<{ cancelledNotificationIds: string[] }> {
  const db = getDb();
  const rows = await db
    .select({ nid: reminders.notificationId })
    .from(reminders)
    .where(and(eq(reminders.noteId, id), isNotNull(reminders.notificationId)));
  await db.update(reminders).set({ notificationId: null, updatedAt: Date.now() }).where(eq(reminders.noteId, id));
  await db.update(notes).set({ deletedAt: Date.now() }).where(eq(notes.id, id));
  return { cancelledNotificationIds: rows.map((r) => r.nid).filter((n): n is string => !!n) };
}

export async function restoreNote(id: string): Promise<void> {
  await getDb().update(notes).set({ deletedAt: null, updatedAt: Date.now() }).where(eq(notes.id, id));
}

export async function hardDeleteNote(id: string): Promise<void> {
  // note_tags and reminders cascade via foreign keys
  await getDb().delete(notes).where(eq(notes.id, id));
}

export async function discardIfEmpty(id: string): Promise<boolean> {
  const note = await getNote(id);
  if (!note) return false;
  if (note.title.trim() === '' && note.bodyText.trim() === '') {
    await hardDeleteNote(id);
    return true;
  }
  return false;
}

export async function tagsForNotes(noteIds: string[]): Promise<Map<string, string[]>> {
  if (noteIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ noteId: noteTags.noteId, tagId: noteTags.tagId })
    .from(noteTags)
    .where(inArray(noteTags.noteId, noteIds));
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.noteId) ?? [];
    list.push(r.tagId);
    map.set(r.noteId, list);
  }
  return map;
}

export async function countLiveNotes(): Promise<number> {
  const rows = await getDb()
    .select({ c: sql<number>`count(*)` })
    .from(notes)
    .where(isNull(notes.deletedAt));
  return rows[0]?.c ?? 0;
}
