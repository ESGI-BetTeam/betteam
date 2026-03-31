import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LeaguesScreen } from '../screens/leagues/LeaguesScreen';
import { PronosticsScreen } from '../screens/pronostics/PronosticsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AppTabParamList } from '../types/navigation';
import { colors, fontSize } from '../theme';

const Tab = createBottomTabNavigator<AppTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Accueil: '🏠',
    Leagues: '🏆',
    Pronostiques: '⚽',
    Profil: '👤',
  };
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[label] ?? '•'}
    </Text>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Leagues" component={LeaguesScreen} options={{ tabBarLabel: 'Leagues' }} />
      <Tab.Screen name="Pronostics" component={PronosticsScreen} options={{ tabBarLabel: 'Pronostiques' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
});
