import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, typo } from '../../theme';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
});
