import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsWide } from '@/hooks/useIsWide';

interface Props {
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function ScreenShell({ title, right, children }: Props) {
  const isWide = useIsWide();
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className={isWide ? 'w-full max-w-3xl flex-1 self-center' : 'flex-1'}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {right}
        </View>
        <View className="flex-1">{children}</View>
      </View>
    </SafeAreaView>
  );
}
