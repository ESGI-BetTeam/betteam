import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fonts } from '../../theme';

export function PronosticsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Pronostiques</Text>
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
    textTransform: 'uppercase',
  },
});
