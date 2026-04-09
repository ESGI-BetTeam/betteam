import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { spacing, typo } from '@/theme';

import { RadioGroupProps } from './RadioGroup.types';

export function RadioGroup({
  options,
  value,
  onChange,
  ItemComponent,
  label,
  disabled = false,
}: RadioGroupProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {label && <Text style={typo.p}>{label}</Text>}
      {options.map((option) => (
        <ItemComponent
          key={option.value}
          option={disabled ? { ...option, disabled: true } : option}
          selected={value === option.value}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
