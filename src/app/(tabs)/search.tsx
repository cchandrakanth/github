import { useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as searchRepo from '@/db/repositories/searchRepo';
import { SearchResultRow } from '@/components/SearchResultRow';
import { EmptyState } from '@/components/EmptyState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useIsWide } from '@/hooks/useIsWide';

export default function SearchScreen() {
  const router = useRouter();
  const isWide = useIsWide();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const active = debounced.trim().length > 0;

  // React Query keys by the debounced query, so late responses for an old
  // query can never overwrite the current one (EC-2).
  const { data: results } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchRepo.searchNotes(debounced),
    enabled: active,
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className={isWide ? 'w-full max-w-2xl flex-1 self-center' : 'flex-1'}>
        <View className="mx-4 my-2 flex-row items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Ionicons name="search" size={18} color="#71717a" />
          <TextInput
            ref={inputRef}
            testID="search-input"
            autoFocus
            accessibilityRole="search"
            placeholder="Search your notes"
            value={query}
            className="flex-1 text-base text-foreground"
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              className="h-8 w-8 items-center justify-center"
              onPress={() => {
                setQuery('');
                inputRef.current?.focus(); // AC-3.3: keep keyboard focus
              }}
            >
              <Ionicons name="close-circle" size={18} color="#a1a1aa" />
            </Pressable>
          )}
        </View>
        {!active ? (
          <EmptyState icon="search-outline" title="Search your notes" message="Find notes by title or content." />
        ) : results && results.length === 0 ? (
          <EmptyState icon="search-outline" title={`No results for “${debounced.trim()}”`} />
        ) : (
          <FlatList
            testID="search-results"
            data={results ?? []}
            keyExtractor={(r) => r.noteId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SearchResultRow result={item} query={debounced} onPress={(noteId) => router.push(`/note/${noteId}`)} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
