import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeaguesStackParamList } from '@/types/navigation';
import { colors } from '@/theme';
import { LeaguesScreen } from '@/screens/leagues/LeaguesScreen';
import { CreateLeagueScreen } from '@/screens/leagues/CreateLeagueScreen';

const Stack = createNativeStackNavigator<LeaguesStackParamList>();

export function LeaguesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="LeaguesHome" component={LeaguesScreen} />
      <Stack.Screen
        name="CreateLeague"
        component={CreateLeagueScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
