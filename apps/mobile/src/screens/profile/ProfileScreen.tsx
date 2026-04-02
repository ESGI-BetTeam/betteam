import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, fontSize, fonts } from '../../theme';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.info}>{user?.username}</Text>
        <Text style={styles.infoSub}>{user?.email}</Text>
        <Button
          title="Se déconnecter"
          variant="danger"
          onPress={logout}
          style={{ marginTop: spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.xxl + 8,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  info: { fontFamily: fonts.bodySemiBold, fontSize: fontSize.lg, color: colors.textPrimary },
  infoSub: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
