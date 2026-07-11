import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { destinations } from '@/components/nav/destinations';

interface Props {
  activeName: string;
  onPress: (name: string) => void;
  children?: React.ReactNode; // extra sections (e.g. folders) appended by later features
}

export function SidePanel({ activeName, onPress, children }: Props) {
  return (
    <View testID="side-panel" className="h-full w-60 border-r border-border bg-background">
      <Text className="px-4 pb-2 pt-5 text-lg font-bold text-foreground">My Notes</Text>
      {destinations.map((d) => {
        const active = d.name === activeName;
        return (
          <Pressable
            key={d.name}
            accessibilityRole="tab"
            accessibilityLabel={d.title}
            accessibilityState={{ selected: active }}
            className={
              active
                ? 'mx-2 flex-row items-center gap-3 rounded-lg bg-primary/10 px-3 py-2'
                : 'mx-2 flex-row items-center gap-3 rounded-lg px-3 py-2'
            }
            onPress={() => onPress(d.name)}
          >
            <Ionicons name={active ? d.iconActive : d.icon} size={20} color={active ? '#4f46e5' : '#71717a'} />
            <Text className={active ? 'text-base text-primary' : 'text-base text-foreground'}>{d.title}</Text>
          </Pressable>
        );
      })}
      {children}
    </View>
  );
}
