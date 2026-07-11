import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScreenShell } from '@/components/ScreenShell';
import { NotesList } from '@/components/NotesList';
import { FoldersBar } from '@/components/folders/FoldersBar';
import type { FolderFilter } from '@/components/folders/FolderChipRow';
import { useIsWide } from '@/hooks/useIsWide';
import * as notesRepo from '@/db/repositories/notesRepo';
import * as tagsRepo from '@/db/repositories/tagsRepo';

export default function NotesScreen() {
  const router = useRouter();
  const isWide = useIsWide();
  const params = useLocalSearchParams<{ folder?: string; tag?: string }>();

  const active: FolderFilter =
    params.folder === undefined || params.folder === '' ? { kind: 'all' } : params.folder === 'unfiled' ? { kind: 'unfiled' } : { kind: 'folder', id: params.folder };
  const folderId = active.kind === 'all' ? undefined : active.kind === 'unfiled' ? null : active.id;
  const tagId = params.tag && params.tag !== '' ? params.tag : undefined;

  const { data: activeTag } = useQuery({
    queryKey: ['tags', 'by-id', tagId ?? 'none'],
    queryFn: async () => (tagId ? (await tagsRepo.tagsById([tagId]))[0] ?? null : null),
  });

  const setFolderFilter = (filter: FolderFilter) =>
    router.setParams({ folder: filter.kind === 'all' ? '' : filter.kind === 'unfiled' ? 'unfiled' : filter.id });

  const createAndOpen = async () => {
    const note = await notesRepo.createNote(folderId ?? null);
    router.push(`/note/${note.id}`);
  };

  return (
    <ScreenShell
      title="Notes"
      right={
        isWide ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New note"
            className="flex-row items-center gap-1 rounded-lg bg-primary px-3 py-2"
            onPress={() => void createAndOpen()}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text className="text-primary-foreground">New note</Text>
          </Pressable>
        ) : undefined
      }
    >
      <View className="flex-1">
        {!isWide && <FoldersBar active={active} onSelect={setFolderFilter} />}
        {activeTag ? (
          <View className="mx-4 mb-1 flex-row items-center gap-2">
            <Text className="text-sm text-muted-foreground">Filtered by</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Clear tag filter ${activeTag.name}`}
              className="flex-row items-center gap-1 rounded-md bg-primary/10 px-2 py-1"
              onPress={() => router.setParams({ tag: '' })}
            >
              <Text className="text-xs text-primary">#{activeTag.name}</Text>
              <Ionicons name="close" size={12} color="#4f46e5" />
            </Pressable>
          </View>
        ) : null}
        <NotesList folderId={folderId} tagId={tagId} onTagPress={(id) => router.setParams({ tag: id })} />
        {!isWide && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New note"
            className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
            onPress={() => void createAndOpen()}
          >
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </ScreenShell>
  );
}
