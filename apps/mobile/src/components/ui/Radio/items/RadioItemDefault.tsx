import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, spacing, typo } from '@/theme';

import { RadioItemProps } from '../RadioGroup.types';

export function RadioItemDefault({ option, selected, onSelect }: RadioItemProps) {
  const isDisabled = option.disabled ?? false;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      accessibilityLabel={option.label}
      onPress={() => !isDisabled && onSelect(option.value)}
      style={({ pressed }) => [
        styles.container,
        pressed && !isDisabled && styles.pressed,
      ]}
      disabled={isDisabled}
    >
      <View style={[
        styles.circle,
        selected && styles.circleSelected,
        isDisabled && styles.circleDisabled,
      ]}>
        {selected && (
          <View style={[styles.dot, isDisabled && styles.dotDisabled]} />
        )}
      </View>

      <View style={styles.textBlock}>
        <Text style={[typo.p, isDisabled && typo.pMuted]}>
          {option.label}
        </Text>
        {option.description && (
          <Text style={[typo.smallSecondary, isDisabled && typo.smallSecondary]}>
            {option.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.65,
  },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: borderWidth.md,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  circleSelected: {
    borderColor: colors.accent,
  },
  circleDisabled: {
    borderColor: colors.borderActive,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  dotDisabled: {
    backgroundColor: colors.borderActive,
  },
  
  textBlock: {
    flex: 1,
    gap: 2,
  },
});
