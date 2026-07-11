import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ScreenShell';

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <ScreenShell title="Settings">
      <View className="flex-1 px-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Trash"
          className="flex-row items-center gap-3 rounded-lg px-3 py-3"
          onPress={() => router.push('/trash')}
        >
          <Ionicons name="trash-outline" size={20} color="#71717a" />
          <Text className="flex-1 text-base text-foreground">Trash</Text>
          <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
        </Pressable>
      </View>
    </ScreenShell>
  );
}
