import { Text, View } from 'react-native';
import { ScreenShell } from '@/components/ScreenShell';

export default function SearchScreen() {
  return (
    <ScreenShell title="Search">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted-foreground">Search your notes.</Text>
      </View>
    </ScreenShell>
  );
}
