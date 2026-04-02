import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, fontSize } from '../../theme';

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
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  info: { fontSize: fontSize.lg, color: colors.textPrimary, fontWeight: '600' },
  infoSub: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
});
