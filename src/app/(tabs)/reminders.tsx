import { Text, View } from 'react-native';
import { ScreenShell } from '@/components/ScreenShell';

export default function RemindersScreen() {
  return (
    <ScreenShell title="Reminders">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground">Reminders on your notes will appear here.</Text>
      </View>
    </ScreenShell>
  );
}
