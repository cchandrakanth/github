import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

export interface SearchResult {
  noteId: string;
  title: string;
  snippet: string; // matched terms wrapped in ⟪ ⟫ markers
  folderName: string | null;
}

export const HIGHLIGHT_OPEN = '⟪';
export const HIGHLIGHT_CLOSE = '⟫';

// User input is never interpreted as FTS5 syntax (EC-1): every term becomes a
// quoted phrase with a prefix star, so operators like AND, -, * are literals.
export function escapeFtsQuery(raw: string): string {
  const terms = raw
    .split(/\s+/)
    .map((t) => t.replace(/"/g, '""').replace(/[‘’“”]/g, ''))
    .map((t) => t.trim())
    .filter((t) => t.replace(/[^\p{L}\p{N}]/gu, '').length > 0);
  return terms.map((t) => `"${t}"*`).join(' ');
}

export async function searchNotes(rawQuery: string, opts: { limit?: number } = {}): Promise<SearchResult[]> {
  const match = escapeFtsQuery(rawQuery);
  if (match.length === 0) return [];
  const limit = opts.limit ?? 50;
  const rows: any[] = await getDb().all(sql`
    select
      n.id as note_id,
      n.title as title,
      snippet(notes_fts, 1, ${HIGHLIGHT_OPEN}, ${HIGHLIGHT_CLOSE}, '…', 12) as snip,
      f.name as folder_name
    from notes_fts
    join notes n on n.rowid = notes_fts.rowid
    left join folders f on f.id = n.folder_id
    where notes_fts match ${match} and n.deleted_at is null
    order by bm25(notes_fts, 10.0, 1.0)
    limit ${limit}
  `);
  return rows.map((r) => ({
    noteId: r.note_id ?? r[0],
    title: r.title ?? r[1],
    snippet: r.snip ?? r[2] ?? '',
    folderName: r.folder_name ?? r[3] ?? null,
  }));
}
