import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PronosticsStackParamList } from '@/types/navigation';
import { colors } from '@/theme';
import { PronosticsListScreen } from '@/screens/pronostics/PronosticsListScreen';
import { PronosticDetailScreen } from '@/screens/pronostics/PronosticDetailScreen';

const Stack = createNativeStackNavigator<PronosticsStackParamList>();

export function PronosticsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="PronosticsHome" component={PronosticsListScreen} />
      <Stack.Screen
        name="PronosticDetail"
        component={PronosticDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
