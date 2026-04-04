import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, typo } from '../../theme';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={typo.h1}>Profil</Text>
      <Text style={typo.p}>{user?.username}</Text>
      <Text style={typo.pSecondary}>{user?.email}</Text>
      <Button
        title="Se déconnecter"
        variant="danger"
        onPress={logout}
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
});
