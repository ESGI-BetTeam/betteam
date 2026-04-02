import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, fontSize, typo } from '@/theme';

export function HomeScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={typo.h1}>Accueil</Text>
        <Text style={[typo.pSecondary, styles.welcome]}>Bienvenue, {user?.username} 👋</Text>
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
  welcome: {
    marginBottom: spacing.xl,
    fontSize: fontSize.lg,
  },
});
