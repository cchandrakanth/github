import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { noteTags, notes, tags, type Note, type Tag } from '@/db/schema';
import { newId } from '@/lib/id';
import { ValidationError } from '@/lib/errors';

function normalizeName(name: string): string {
  const trimmed = name.trim().replace(/^#+/, '').trim();
  if (trimmed.length === 0) throw new ValidationError('Tag name cannot be empty');
  return trimmed;
}

// Case-insensitive reuse (EC-2): "Urgent" and "#urgent" resolve to the same tag.
export async function findOrCreateTag(name: string): Promise<Tag> {
  const normalized = normalizeName(name);
  const db = getDb();
  const existing = await db
    .select()
    .from(tags)
    .where(sql`${tags.name} = ${normalized} COLLATE NOCASE`)
    .limit(1);
  if (existing[0]) return existing[0];
  const tag: Tag = { id: newId(), name: normalized, color: null, createdAt: Date.now() };
  await db.insert(tags).values(tag);
  return tag;
}

export async function listTags(): Promise<Tag[]> {
  return getDb().select().from(tags).orderBy(asc(tags.name));
}

export async function tagsById(ids: string[]): Promise<Tag[]> {
  if (ids.length === 0) return [];
  return getDb().select().from(tags).where(inArray(tags.id, ids));
}

export async function setNoteTags(noteId: string, tagIds: string[]): Promise<void> {
  const db = getDb();
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  if (tagIds.length > 0) await db.insert(noteTags).values(tagIds.map((tagId) => ({ noteId, tagId })));
}

export async function tagsForNote(noteId: string): Promise<Tag[]> {
  return getDb()
    .select({ id: tags.id, name: tags.name, color: tags.color, createdAt: tags.createdAt })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, noteId))
    .orderBy(asc(tags.name));
}

export async function deleteTag(id: string): Promise<void> {
  await getDb().delete(tags).where(eq(tags.id, id)); // note_tags cascade
}

// Composes with the folder filter (AC-3.5); trashed notes excluded.
export async function listNotesByTag(tagId: string, filter?: { folderId?: string | null }): Promise<Note[]> {
  const conds = [eq(noteTags.tagId, tagId), isNull(notes.deletedAt)];
  if (filter && filter.folderId !== undefined) {
    conds.push(filter.folderId === null ? isNull(notes.folderId) : eq(notes.folderId, filter.folderId));
  }
  const rows = await getDb()
    .select({
      id: notes.id,
      title: notes.title,
      bodyHtml: notes.bodyHtml,
      bodyText: notes.bodyText,
      folderId: notes.folderId,
      pinned: notes.pinned,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      deletedAt: notes.deletedAt,
    })
    .from(noteTags)
    .innerJoin(notes, eq(noteTags.noteId, notes.id))
    .where(and(...conds))
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
  return rows;
}
