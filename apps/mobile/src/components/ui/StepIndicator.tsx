import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typo } from '@/theme';

interface StepIndicatorProps {
  current: number;
  total?: number;
}

export function StepIndicator({ current, total = 4 }: StepIndicatorProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isDone = step < current;
        const isCurrent = step === current;
        const isActive = isDone || isCurrent;

        return (
          <React.Fragment key={step}>
            <View style={[styles.ringWrapper, isCurrent && styles.ringCurrent]}>
              <View style={[styles.circle, isActive ? styles.circleActive : styles.circleIdle]}>
                <Text style={[styles.number, !isActive && styles.numberIdle]}>{step}</Text>
              </View>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.connector, isDone && styles.connectorDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const SIZE = 52;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringWrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  ringCurrent: {
    borderColor: colors.accent,
  },
  circle: {
    width: SIZE - 12,
    height: SIZE - 12,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.accent,
  },
  circleIdle: {
    backgroundColor: colors.textMuted,
  },
  number: {
    ...typo.h4,
    marginBottom: 0,
    color: colors.white,
    lineHeight: undefined,
  },
  numberIdle: {
    color: colors.textPrimary,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  connectorDone: {
    backgroundColor: colors.accent,
  },
});
