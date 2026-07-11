import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ScreenShell';
import { NotesList } from '@/components/NotesList';
import { useIsWide } from '@/hooks/useIsWide';
import * as notesRepo from '@/db/repositories/notesRepo';

export default function NotesScreen() {
  const router = useRouter();
  const isWide = useIsWide();

  const createAndOpen = async () => {
    const note = await notesRepo.createNote();
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
        <NotesList />
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
