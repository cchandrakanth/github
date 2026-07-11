import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { destinations } from '@/components/nav/destinations';

interface Props {
  activeName: string;
  onPress: (name: string) => void;
}

export function BottomTabBar({ activeName, onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="bottom-tab-bar"
      className="flex-row border-t border-border bg-background"
      style={{ paddingBottom: insets.bottom }}
    >
      {destinations.map((d) => {
        const active = d.name === activeName;
        return (
          <Pressable
            key={d.name}
            accessibilityRole="tab"
            accessibilityLabel={d.title}
            accessibilityState={{ selected: active }}
            className="flex-1 items-center justify-center py-2"
            onPress={() => onPress(d.name)}
          >
            <Ionicons name={active ? d.iconActive : d.icon} size={22} color={active ? '#4f46e5' : '#71717a'} />
            <Text className={active ? 'text-xs text-primary' : 'text-xs text-muted-foreground'}>{d.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
