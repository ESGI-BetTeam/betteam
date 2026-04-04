import React, { JSX } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTabParamList } from '@/types/navigation';
import { colors, spacing, radius, typo } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/ui/Header';

import { Home2, People , Receipt21, Profile, MainComponent } from 'iconsax-react-nativejs';

// Screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { LeaguesScreen } from '@/screens/leagues/LeaguesScreen';
import { PronosticsScreen } from '@/screens/pronostics/PronosticsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ComponentScreen } from '@/screens/components/ComponentScreen';

type TabName = keyof AppTabParamList;

const TAB_CONFIG: Record<TabName, { label: string; icon: React.ComponentType<{ size: string; color: string; variant?: 'Bulk' | 'Outline'  }> }> = {
  Home: { label: 'Accueil', icon: Home2 },
  Leagues: { label: 'Ligues', icon: People },
  Pronostics: { label: 'Pronostiques', icon: Receipt21 },
  Profile: { label: 'Profil', icon: Profile },
  Components: { label: 'Composants', icon: MainComponent },
};

const SCREEN_MAP: Record<TabName, React.ComponentType> = {
  Home:       HomeScreen,
  Leagues:    LeaguesScreen,
  Pronostics: PronosticsScreen,
  Profile:    ProfileScreen,
  Components: ComponentScreen,
};

function TabIcon({ name, focused }: { name: TabName; focused: boolean }) {
  const { icon: Icon } = TAB_CONFIG[name];
  const color = focused ? colors.accent : colors.textSecondary;

  return (
    <View style={styles.iconWrapper}>
      <Icon size="22" color={color} variant={focused ? 'Bulk' : 'Outline'} />
    </View>
  );
}

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        username={user?.username}
        avatarUri={user?.avatar}
      />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={route.name as TabName} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[typo.p, { color: focused ? colors.accent : colors.textSecondary }]}>
              {TAB_CONFIG[route.name as TabName].label}
            </Text>
          ),
        })}
      >
        {(Object.keys(TAB_CONFIG) as TabName[]).map((name) => (
          <Tab.Screen
            key={name}
            name={name}
            component={SCREEN_MAP[name]}
            options={{ tabBarLabel: TAB_CONFIG[name].label }}
          />
        ))}
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingTop: spacing.sm,
  },
  iconWrapper: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  icon: {
    fontSize: 20,
    opacity: 0.45,
  },
  iconFocused: {
    color: colors.accent,
    opacity: 1,
    fontSize: 22,
  },
});
