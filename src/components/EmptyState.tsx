import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

interface Props {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: Props) {
  return (
    <View testID="empty-state" className="flex-1 items-center justify-center gap-3 p-8">
      <Ionicons name={icon} size={40} color="#a1a1aa" />
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {message ? <Text className="text-center text-sm text-muted-foreground">{message}</Text> : null}
    </View>
  );
}
