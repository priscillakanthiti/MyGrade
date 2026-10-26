import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors, font } from '../../theme';

function tabIcon(active, inactive) {
  return function TabIcon({ color, size, focused }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: font.weight.semibold },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen name="results-tab" options={{ title: 'Results', tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
