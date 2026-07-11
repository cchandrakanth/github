import { FlatList } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { noteActionsMenu } from '@/components/noteActions';
import * as notesRepo from '@/db/repositories/notesRepo';
import type { Note } from '@/db/schema';

interface Props {
  folderId?: string | null; // undefined = all notes
}

export function NotesList({ folderId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notes', folderId === undefined ? 'all' : folderId ?? 'unfiled'],
    queryFn: () => notesRepo.listNotes(folderId === undefined ? undefined : { folderId }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notes'] });
  const onLongPress = (note: Note) => noteActionsMenu(note, refresh);

  if (data && data.length === 0) {
    return (
      <EmptyState icon="document-text-outline" title="No notes yet" message="Tap + to create your first note." />
    );
  }

  return (
    <FlatList
      testID="notes-list"
      data={data ?? []}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => (
        <NoteCard note={item} onPress={(n) => router.push(`/note/${n.id}`)} onLongPress={onLongPress} />
      )}
      contentContainerStyle={{ paddingBottom: 96 }}
    />
  );
}
