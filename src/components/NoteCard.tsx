import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Note } from '@/db/schema';
import { relativeTime } from '@/lib/relativeTime';

interface Props {
  note: Note;
  onPress: (note: Note) => void;
  onLongPress: (note: Note) => void;
  tags?: { id: string; name: string }[];
  onTagPress?: (tagId: string) => void;
}

export function NoteCard({ note, onPress, onLongPress, tags, onTagPress }: Props) {
  const preview = note.bodyText.split('\n').slice(0, 2).join('\n');
  return (
    <Pressable
      testID={`note-card-${note.id}`}
      accessibilityRole="button"
      accessibilityLabel={note.title || 'Untitled'}
      className="mx-4 my-1.5 gap-1 rounded-xl border border-border bg-background p-4"
      onPress={() => onPress(note)}
      onLongPress={() => onLongPress(note)}
    >
      <View className="flex-row items-center gap-2">
        {note.pinned === 1 && <Ionicons name="pin" size={14} color="#4f46e5" />}
        <Text numberOfLines={1} className={note.title ? 'flex-1 text-base font-semibold text-foreground' : 'flex-1 text-base font-semibold text-muted-foreground'}>
          {note.title || 'Untitled'}
        </Text>
      </View>
      {preview.length > 0 && (
        <Text numberOfLines={2} className="text-sm text-muted-foreground">
          {preview}
        </Text>
      )}
      <View className="flex-row items-center gap-2">
        <Text className="text-xs text-muted-foreground">{relativeTime(note.updatedAt)}</Text>
        {tags?.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`Tag ${t.name}`}
            className="rounded-md bg-primary/10 px-2 py-0.5"
            onPress={() => onTagPress?.(t.id)}
          >
            <Text className="text-xs text-primary">#{t.name}</Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}
