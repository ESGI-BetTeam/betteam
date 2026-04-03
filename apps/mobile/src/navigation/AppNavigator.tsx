import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { AppTabParamList } from '@/types/navigation';
import { colors, spacing, radius, typo } from '@/theme';

import { Home2, Cup, AddSquare, UserSquare, MainComponent } from 'iconsax-reactjs';

// Screens
import { HomeScreen } from '@/screens/home/HomeScreen';
import { LeaguesScreen } from '@/screens/leagues/LeaguesScreen';
import { PronosticsScreen } from '@/screens/pronostics/PronosticsScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { ComponentScreen } from '@/screens/components/ComponentScreen';

type TabName = keyof AppTabParamList;

const TAB_CONFIG: Record<TabName, { label: string; icon: object }> = {
  Home: { label: 'Accueil', icon: <Home2 size="32" color="#37d67a"/> },
  Leagues: { label: 'Ligues', icon: <Cup size="32" color="#37d67a"/> },
  Pronostics: { label: 'Pronostiques', icon: <AddSquare size="32" color="#37d67a"/> },
  Profile: { label: 'Profil', icon: <UserSquare size="32" color="#37d67a"/> },
  Components: { label: 'Composants', icon: <MainComponent size="32" color="#37d67a"/> },
};

const SCREEN_MAP: Record<TabName, React.ComponentType> = {
  Home:       HomeScreen,
  Leagues:    LeaguesScreen,
  Pronostics: PronosticsScreen,
  Profile:    ProfileScreen,
  Components: ComponentScreen,
};

function TabIcon({ name, focused }: { name: TabName; focused: boolean }) {
  const { icon } = TAB_CONFIG[name];

  return (
    <View style={styles.iconWrapper}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  return (
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
          <Text>
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
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingTop: spacing.sm,
  },
  tabLabel: {
    ...typo.h1,
    marginTop: 10,
  },
  tabLabelFocused: {
    color: colors.accent,
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