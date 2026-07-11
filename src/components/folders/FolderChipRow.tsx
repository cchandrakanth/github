import { ScrollView, Pressable, Text } from 'react-native';
import type { FolderWithCount } from '@/db/repositories/foldersRepo';

export type FolderFilter = { kind: 'all' } | { kind: 'unfiled' } | { kind: 'folder'; id: string };

interface Props {
  folders: FolderWithCount[];
  unfiledCount: number;
  totalCount: number;
  active: FolderFilter;
  onSelect: (filter: FolderFilter) => void;
  onLongPressFolder?: (folder: FolderWithCount) => void;
  onCreate: () => void;
}

function Chip({ label, selected, onPress, onLongPress, testID }: { label: string; selected: boolean; onPress: () => void; onLongPress?: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={
        selected
          ? 'rounded-full border border-primary bg-primary px-3 py-1.5'
          : 'rounded-full border border-border px-3 py-1.5'
      }
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Text className={selected ? 'text-sm text-primary-foreground' : 'text-sm text-foreground'}>{label}</Text>
    </Pressable>
  );
}

export function FolderChipRow({ folders, unfiledCount, totalCount, active, onSelect, onLongPressFolder, onCreate }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Chip label={`All (${totalCount})`} selected={active.kind === 'all'} onPress={() => onSelect({ kind: 'all' })} />
      <Chip label={`Unfiled (${unfiledCount})`} selected={active.kind === 'unfiled'} onPress={() => onSelect({ kind: 'unfiled' })} />
      {folders.map((f) => (
        <Chip
          key={f.id}
          testID={`folder-chip-${f.id}`}
          label={`${f.name} (${f.liveNoteCount})`}
          selected={active.kind === 'folder' && active.id === f.id}
          onPress={() => onSelect({ kind: 'folder', id: f.id })}
          onLongPress={onLongPressFolder ? () => onLongPressFolder(f) : undefined}
        />
      ))}
      <Chip label="+ New" selected={false} onPress={onCreate} />
    </ScrollView>
  );
}
