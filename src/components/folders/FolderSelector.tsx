import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as foldersRepo from '@/db/repositories/foldersRepo';

interface Props {
  folderId: string | null;
  onSelect: (folderId: string | null) => void;
}

// Editor control: shows the note's folder, opens a picker to move it (AC-2.1).
export function FolderSelector({ folderId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const { data: folders } = useQuery({ queryKey: ['folders'], queryFn: foldersRepo.listFoldersWithCounts });
  const current = folders?.find((f) => f.id === folderId);

  return (
    <>
      <Pressable
        testID="folder-selector"
        accessibilityRole="button"
        accessibilityLabel={`Folder: ${current?.name ?? 'Unfiled'}`}
        className="flex-row items-center gap-1 rounded-lg border border-border px-2 py-1"
        onPress={() => setOpen(true)}
      >
        <Ionicons name="folder-outline" size={14} color="#71717a" />
        <Text className="text-xs text-muted-foreground">{current?.name ?? 'Unfiled'}</Text>
        <Ionicons name="chevron-down" size={12} color="#71717a" />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/40 p-6" onPress={() => setOpen(false)}>
          <View className="w-full max-w-sm rounded-xl bg-background p-2">
            <FlatList
              data={[{ id: null as string | null, name: 'Unfiled' }, ...(folders ?? [])]}
              keyExtractor={(f) => f.id ?? 'unfiled'}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move to ${item.name}`}
                  className="flex-row items-center gap-2 rounded-lg px-3 py-2.5"
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Ionicons
                    name={item.id === folderId || (item.id === null && folderId === null) ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#4f46e5"
                  />
                  <Text className="text-base text-foreground">{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
