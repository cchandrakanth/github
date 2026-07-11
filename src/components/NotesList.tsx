import { FlatList } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { noteActionsMenu } from '@/components/noteActions';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as tagsRepo from '@/db/repositories/tagsRepo';
import type { Note, Tag } from '@/db/schema';

interface Props {
  folderId?: string | null; // undefined = all notes
  tagId?: string;
  onTagPress?: (tagId: string) => void;
}

export function NotesList({ folderId, tagId, onTagPress }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notes', folderId === undefined ? 'all' : folderId ?? 'unfiled', tagId ?? 'no-tag'],
    queryFn: () => {
      const filter = folderId === undefined ? undefined : { folderId };
      return tagId ? tagsRepo.listNotesByTag(tagId, filter) : notesRepo.listNotes(filter);
    },
  });

  const ids = (data ?? []).map((n) => n.id);
  const { data: tagMap } = useQuery({
    queryKey: ['note-tags', ids.join(',')],
    queryFn: async () => {
      const map = new Map<string, Tag[]>();
      const idsByNote = await notesRepo.tagsForNotes(ids);
      const allIds = [...new Set([...idsByNote.values()].flat())];
      const tagRows = await tagsRepo.tagsById(allIds);
      const byId = new Map(tagRows.map((t) => [t.id, t]));
      for (const [noteId, tagIds] of idsByNote) {
        map.set(noteId, tagIds.map((id) => byId.get(id)!).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)));
      }
      return map;
    },
    enabled: ids.length > 0,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notes'] });
  const onLongPress = (note: Note) => noteActionsMenu(note, refresh);

  if (data && data.length === 0) {
    return tagId || folderId !== undefined ? (
      <EmptyState icon="filter-outline" title="No notes match" message="Try a different folder or tag." />
    ) : (
      <EmptyState icon="document-text-outline" title="No notes yet" message="Tap + to create your first note." />
    );
  }

  return (
    <FlatList
      testID="notes-list"
      data={data ?? []}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => (
        <NoteCard
          note={item}
          onPress={(n) => router.push(`/note/${n.id}`)}
          onLongPress={onLongPress}
          tags={tagMap?.get(item.id)}
          onTagPress={onTagPress}
        />
      )}
      contentContainerStyle={{ paddingBottom: 96 }}
    />
  );
}
