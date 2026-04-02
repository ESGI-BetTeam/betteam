import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../theme';

type StateVariant = 'active' | 'soon' | 'finished' ;

const variantConfig: Record<StateVariant, { label: string; color: string }> = {
  active: { label: 'En cours', color: colors.accent },
  soon: { label: 'Bientôt', color: colors.textSecondary },
  finished: { label: 'Terminé', color: colors.error },
};

interface StateProps {
  variant: StateVariant;
  label?: string;
}

export function State({ variant, label }: StateProps) {
  const config = variantConfig[variant];
  const displayLabel = label ?? config.label;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
