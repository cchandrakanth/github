import { View } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useIsWide } from '@/hooks/useIsWide';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { SidePanel } from '@/components/nav/SidePanel';
import { destinations } from '@/components/nav/destinations';

function activeNameFromPath(pathname: string): string {
  const match = destinations.find((d) => d.href !== '/' && pathname.startsWith(d.href));
  return match?.name ?? 'index';
}

export default function TabsLayout() {
  const isWide = useIsWide();
  const pathname = usePathname();
  const router = useRouter();
  const go = (name: string) => {
    const dest = destinations.find((d) => d.name === name);
    if (dest) router.navigate(dest.href as never);
  };

  return (
    <View className="flex-1 flex-row bg-background">
      {isWide && <SidePanel activeName={activeNameFromPath(pathname)} onPress={go} />}
      <View className="flex-1">
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={({ state, navigation }) => {
            if (isWide) return null;
            const activeName = state.routes[state.index]?.name ?? 'index';
            return <BottomTabBar activeName={activeName} onPress={(name) => navigation.navigate(name as never)} />;
          }}
        >
          {destinations.map((d) => (
            <Tabs.Screen key={d.name} name={d.name} options={{ title: d.title }} />
          ))}
        </Tabs>
      </View>
    </View>
  );
}
