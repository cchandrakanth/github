import { Text, View } from 'react-native';
import { ScreenShell } from '@/components/ScreenShell';

export default function SettingsScreen() {
  return (
    <ScreenShell title="Settings">
      <View className="flex-1 p-4">
        <Text className="text-muted-foreground">Settings will appear here.</Text>
      </View>
    </ScreenShell>
  );
}
