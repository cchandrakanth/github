import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as tagsRepo from '@/db/repositories/tagsRepo';
import type { Tag } from '@/db/schema';

interface Props {
  visible: boolean;
  selectedIds: string[];
  onChange: (tagIds: string[]) => void;
  onClose: () => void;
}

export function TagPicker({ visible, selectedIds, onChange, onClose }: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsRepo.listTags, enabled: visible });

  const filtered = (allTags ?? []).filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));
  const exactMatch = (allTags ?? []).some((t) => t.name.toLowerCase() === query.trim().replace(/^#+/, '').toLowerCase());

  const toggle = (tag: Tag) => {
    onChange(selectedIds.includes(tag.id) ? selectedIds.filter((id) => id !== tag.id) : [...selectedIds, tag.id]);
  };

  const createInline = async () => {
    const tag = await tagsRepo.findOrCreateTag(query);
    void queryClient.invalidateQueries({ queryKey: ['tags'] });
    if (!selectedIds.includes(tag.id)) onChange([...selectedIds, tag.id]);
    setQuery('');
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[70%] gap-3 rounded-t-2xl bg-background p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">Tags</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Done" className="rounded-lg bg-primary px-3 py-1.5" onPress={onClose}>
              <Text className="text-primary-foreground">Done</Text>
            </Pressable>
          </View>
          <TextInput
            testID="tag-search-input"
            placeholder="Search or create tag"
            value={query}
            className="rounded-lg border border-border px-3 py-2 text-base text-foreground"
            onChangeText={setQuery}
          />
          {query.trim().length > 0 && !exactMatch && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Create tag ${query.trim()}`}
              className="flex-row items-center gap-2 rounded-lg bg-primary/10 px-3 py-2"
              onPress={() => void createInline()}
            >
              <Ionicons name="add" size={16} color="#4f46e5" />
              <Text className="text-primary">Create “{query.trim().replace(/^#+/, '')}”</Text>
            </Pressable>
          )}
          <FlatList
            testID="tag-list"
            data={filtered}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => {
              const selected = selectedIds.includes(item.id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Tag ${item.name}`}
                  accessibilityState={{ checked: selected }}
                  className="flex-row items-center gap-3 px-1 py-2.5"
                  onPress={() => toggle(item)}
                >
                  <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? '#4f46e5' : '#a1a1aa'} />
                  <Text className="text-base text-foreground">#{item.name}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
