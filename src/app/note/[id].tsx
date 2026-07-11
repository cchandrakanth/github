import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as notesRepo from '@/db/repositories/notesRepo';
import { useAutosave } from '@/hooks/useAutosave';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useIsWide } from '@/hooks/useIsWide';
import type { Note } from '@/db/schema';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isWide = useIsWide();
  const [note, setNote] = useState<Note | null>(null);
  const [missing, setMissing] = useState(false);
  const noteId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void notesRepo.getNote(String(id)).then((n) => {
      if (cancelled) return;
      if (!n) setMissing(true);
      else {
        noteId.current = n.id;
        setNote(n);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { schedule, flush } = useAutosave<{ title?: string; bodyHtml?: string }>(async (patch) => {
    if (!noteId.current) return;
    await notesRepo.updateNoteContent(noteId.current, patch);
    void queryClient.invalidateQueries({ queryKey: ['notes'] });
  });

  const latest = useRef<{ title?: string; bodyHtml?: string }>({});
  const onTitle = useCallback(
    (title: string) => {
      latest.current = { ...latest.current, title };
      schedule(latest.current);
    },
    [schedule],
  );
  const onBody = useCallback(
    (bodyHtml: string) => {
      latest.current = { ...latest.current, bodyHtml };
      schedule(latest.current);
    },
    [schedule],
  );

  // Flush pending edits, then discard the note if it is completely empty (AC-1.3).
  useEffect(() => {
    return () => {
      flush();
      const nid = noteId.current;
      if (nid) setTimeout(() => void notesRepo.discardIfEmpty(nid), 0);
    };
  }, [flush]);

  if (missing) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <Text className="text-muted-foreground">This note no longer exists.</Text>
      </View>
    );
  }
  if (!note) return <View className="flex-1 bg-background" />;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className={isWide ? 'w-full max-w-3xl flex-1 self-center' : 'flex-1'}>
        <View className="flex-row items-center gap-2 px-2 py-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
          >
            <Ionicons name="arrow-back" size={22} color="#71717a" />
          </Pressable>
          <Text className="text-xs text-muted-foreground">Saved automatically</Text>
        </View>
        <TextInput
          testID="note-title-input"
          autoFocus={note.title === '' && note.bodyText === ''}
          defaultValue={note.title}
          placeholder="Title"
          className="px-4 pb-1 pt-2 text-xl font-bold text-foreground"
          onChangeText={onTitle}
        />
        <RichTextEditor initialHtml={note.bodyHtml} onChangeHtml={onBody} />
      </View>
    </SafeAreaView>
  );
}
