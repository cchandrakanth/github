import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as notesRepo from '@/db/repositories/notesRepo';
import { rescheduleForNote } from '@/lib/notifications';
import { EmptyState } from '@/components/EmptyState';
import { confirmAction } from '@/lib/confirm';
import { relativeTime } from '@/lib/relativeTime';

export function TrashList() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['trash'], queryFn: notesRepo.listTrashedNotes });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['trash'] });
    void queryClient.invalidateQueries({ queryKey: ['notes'] });
  };

  if (data && data.length === 0) {
    return <EmptyState icon="trash-outline" title="Trash is empty" message="Deleted notes appear here." />;
  }

  return (
    <FlatList
      testID="trash-list"
      data={data ?? []}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => (
        <View className="mx-4 my-1.5 flex-row items-center gap-3 rounded-xl border border-border p-4">
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              {item.title || 'Untitled'}
            </Text>
            <Text className="text-xs text-muted-foreground">Deleted {relativeTime(item.deletedAt ?? item.updatedAt)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Restore ${item.title || 'Untitled'}`}
            onPress={() =>
              void notesRepo.restoreNote(item.id).then(async () => {
                await rescheduleForNote(item.id); // EC-4: restore re-arms enabled reminders
                refresh();
              })
            }
          >
            <Text className="text-primary">Restore</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete forever ${item.title || 'Untitled'}`}
            onPress={() =>
              confirmAction('Delete forever?', 'This permanently deletes the note and its reminders.', 'Delete forever', () =>
                void notesRepo.hardDeleteNote(item.id).then(refresh),
              )
            }
          >
            <Text className="text-destructive">Delete forever</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

export default function TrashScreen() {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center gap-2 px-2 py-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-10 w-10 items-center justify-center rounded-full"
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/settings'))}
        >
          <Ionicons name="arrow-back" size={22} color="#71717a" />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Trash</Text>
      </View>
      <TrashList />
    </SafeAreaView>
  );
}
