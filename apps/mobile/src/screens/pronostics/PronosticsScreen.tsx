import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typo } from '../../theme';

export function PronosticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={typo.h1}>Pronostiques</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
});
