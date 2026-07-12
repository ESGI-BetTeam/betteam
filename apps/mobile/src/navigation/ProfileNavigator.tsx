import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/types/navigation';
import { colors } from '@/theme';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { MyBetsScreen } from '@/screens/profile/MyBetsScreen';
import { AdminDemoScreen } from '@/screens/admin/AdminDemoScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen
        name="MyBets"
        component={MyBetsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AdminDemo"
        component={AdminDemoScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}
