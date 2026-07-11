import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { folders, notes, type Folder } from '@/db/schema';
import { newId } from '@/lib/id';
import { DuplicateNameError, ValidationError } from '@/lib/errors';

async function assertNameAvailable(name: string, excludeId?: string): Promise<string> {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new ValidationError('Folder name cannot be empty');
  const rows = await getDb()
    .select({ id: folders.id })
    .from(folders)
    .where(sql`${folders.name} = ${trimmed} COLLATE NOCASE`);
  if (rows.some((r) => r.id !== excludeId)) throw new DuplicateNameError(`Folder "${trimmed}" already exists`);
  return trimmed;
}

export async function createFolder(name: string): Promise<Folder> {
  const trimmed = await assertNameAvailable(name);
  const db = getDb();
  const maxRows = await db.select({ m: sql<number>`coalesce(max(${folders.position}), -1)` }).from(folders);
  const now = Date.now();
  const folder: Folder = { id: newId(), name: trimmed, position: (maxRows[0]?.m ?? -1) + 1, createdAt: now, updatedAt: now };
  await db.insert(folders).values(folder);
  return folder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const trimmed = await assertNameAvailable(name, id);
  await getDb().update(folders).set({ name: trimmed, updatedAt: Date.now() }).where(eq(folders.id, id));
}

export async function reorderFolders(orderedIds: string[]): Promise<void> {
  const db = getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(folders).set({ position: i, updatedAt: Date.now() }).where(eq(folders.id, orderedIds[i]));
  }
}

// Notes are never deleted with their folder: FK is ON DELETE SET NULL → Unfiled (AC-1.3).
export async function deleteFolder(id: string): Promise<void> {
  await getDb().delete(folders).where(eq(folders.id, id));
}

export interface FolderWithCount extends Folder {
  liveNoteCount: number;
}

export async function listFoldersWithCounts(): Promise<FolderWithCount[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: folders.id,
      name: folders.name,
      position: folders.position,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
      liveNoteCount: sql<number>`(
        select count(*) from notes n
        where n.folder_id = folders.id and n.deleted_at is null
      )`,
    })
    .from(folders)
    .orderBy(asc(folders.position));
  return rows;
}

export async function countUnfiled(): Promise<number> {
  const rows = await getDb()
    .select({ c: sql<number>`count(*)` })
    .from(notes)
    .where(and(isNull(notes.folderId), isNull(notes.deletedAt)));
  return rows[0]?.c ?? 0;
}

export async function getFolder(id: string): Promise<Folder | null> {
  const rows = await getDb().select().from(folders).where(eq(folders.id, id)).limit(1);
  return rows[0] ?? null;
}
