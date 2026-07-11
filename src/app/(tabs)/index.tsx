import { Text, View } from 'react-native';
import { ScreenShell } from '@/components/ScreenShell';

export default function NotesScreen() {
  return (
    <ScreenShell title="Notes">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground">Your notes will appear here.</Text>
      </View>
    </ScreenShell>
  );
}
