import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius,spacing, fontSize } from '@/theme';

type StateVariant = 'active' | 'live' | 'soon' | 'finished';

const variantConfig: Record<StateVariant, { label: string; color: string }> = {
  active: { label: 'En cours', color: colors.accent },
  live:  { label: 'Direct', color: colors.error },
  soon: { label: 'Bientôt', color: colors.textSecondary },
  finished: { label: 'Terminé', color: colors.textMuted },
};

interface StateProps {
  variant: StateVariant;
  isAnimated?: boolean;
  label?: string;
}

export function State({ variant, isAnimated = false, label }: StateProps) {
  const config = variantConfig[variant];
  const displayLabel = label ?? config.label;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAnimated) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.65, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isAnimated]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { backgroundColor: config.color, opacity }]} />
      <Animated.Text style={[styles.label, { color: config.color, opacity }]}>
        {displayLabel}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    fontFamily: 'Inter-Regular',
  },
});
