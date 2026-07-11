import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NameDialog } from '@/components/NameDialog';
import { useFolderData } from '@/components/folders/useFolderData';
import * as foldersRepo from '@/db/repositories/foldersRepo';
import { confirmAction } from '@/lib/confirm';
import type { FolderWithCount } from '@/db/repositories/foldersRepo';

// Folder navigation section rendered inside the wide-layout side panel.
export function FolderSection() {
  const router = useRouter();
  const { folders, unfiledCount, totalCount, refresh } = useFolderData();
  const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'rename'; folder: FolderWithCount } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goTo = (filter: string | undefined) =>
    router.navigate({ pathname: '/', params: filter === undefined ? {} : { folder: filter } } as never);

  const submit = async (value: string) => {
    try {
      if (dialog?.mode === 'rename') await foldersRepo.renameFolder(dialog.folder.id, value);
      else await foldersRepo.createFolder(value);
      setDialog(null);
      setError(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = (folder: FolderWithCount) =>
    confirmAction('Delete folder?', `Notes in "${folder.name}" move to Unfiled.`, 'Delete', () => {
      void foldersRepo.deleteFolder(folder.id).then(() => {
        goTo(undefined); // EC-1: never leave the list filtered by a deleted folder
        refresh();
      });
    });

  const Row = ({ label, count, onPress, folder }: { label: string; count: number; onPress: () => void; folder?: FolderWithCount }) => (
    <View className="mx-2 flex-row items-center rounded-lg px-3 py-2">
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${count} notes`} className="flex-1 flex-row items-center gap-2" onPress={onPress}>
        <Ionicons name="folder-outline" size={16} color="#71717a" />
        <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
          {label}
        </Text>
        <Text className="text-xs text-muted-foreground">{count}</Text>
      </Pressable>
      {folder && (
        <View className="flex-row">
          <Pressable accessibilityRole="button" accessibilityLabel={`Rename ${label}`} className="px-1" onPress={() => setDialog({ mode: 'rename', folder })}>
            <Ionicons name="pencil-outline" size={14} color="#a1a1aa" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${label}`} className="px-1" onPress={() => remove(folder)}>
            <Ionicons name="trash-outline" size={14} color="#a1a1aa" />
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View testID="folder-section" className="mt-4 border-t border-border pt-3">
      <Text className="px-4 pb-1 text-xs font-semibold uppercase text-muted-foreground">Folders</Text>
      <Row label="All" count={totalCount} onPress={() => goTo(undefined)} />
      <Row label="Unfiled" count={unfiledCount} onPress={() => goTo('unfiled')} />
      {folders.map((f) => (
        <Row key={f.id} label={f.name} count={f.liveNoteCount} onPress={() => goTo(f.id)} folder={f} />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New folder"
        className="mx-2 flex-row items-center gap-2 rounded-lg px-3 py-2"
        onPress={() => {
          setError(null);
          setDialog({ mode: 'create' });
        }}
      >
        <Ionicons name="add" size={16} color="#4f46e5" />
        <Text className="text-sm text-primary">New folder</Text>
      </Pressable>
      {dialog && (
        <NameDialog
          visible
          title={dialog.mode === 'rename' ? 'Rename folder' : 'New folder'}
          initialValue={dialog.mode === 'rename' ? dialog.folder.name : ''}
          submitLabel={dialog.mode === 'rename' ? 'Rename' : 'Create'}
          error={error}
          onSubmit={(v) => void submit(v)}
          onClose={() => {
            setDialog(null);
            setError(null);
          }}
        />
      )}
    </View>
  );
}
