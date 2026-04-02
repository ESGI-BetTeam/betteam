import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../../theme';
import { State } from '@/components/ui/State';

export function ComponentScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Components</Text>
        <Text style={styles.subTitle}>States :</Text>
        <State variant="active" label='En Cours'/>
        <State variant="live" isAnimated/>
        <State variant="soon"/>
        <State variant="finished"/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background},
  container: { flex: 1, padding: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.textPrimary },
  subTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textSecondary },
});
