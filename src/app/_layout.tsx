import '../../global.css';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { openAppDb } from '@/db/client';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    openAppDb()
      .then(() => !cancelled && setReady(true))
      .catch((e) => !cancelled && setError(String(e?.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background p-8">
        <Text className="text-lg font-semibold text-foreground">Could not open your notes</Text>
        <Text className="text-center text-sm text-muted-foreground">{error}</Text>
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-primary px-4 py-2"
          onPress={() => setAttempt((a) => a + 1)}
        >
          <Text className="text-primary-foreground">Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (!ready) return <View className="flex-1 bg-background" />;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
