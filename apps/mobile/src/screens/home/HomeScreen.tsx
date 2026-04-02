import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, fontSize } from '@/theme';

export function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Accueil</Text>
        <Text style={styles.welcome}>Bienvenue, {user?.username} 👋</Text>
        <Button title="Se déconnecter" variant="outline" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl + 8,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  welcome: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
});
