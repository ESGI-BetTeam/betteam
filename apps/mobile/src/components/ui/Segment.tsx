import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  View,
  ViewStyle,
  Pressable,
} from 'react-native';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

type ItemStructure = { label: string, value: string };

interface TagProps {
  options: ItemStructure[];
  value?: string;
  onChange?: (value: string) => void;
  style?: ViewStyle;
}

export function Segment({
  options,
  value,
  onChange,
  style,
}: TagProps) {
  const [selected, setSelected] = useState(value ?? options[0]?.value);

  const handlePress = (val: string) => {
    setSelected(val);
    onChange?.(val);
  };

  return (
    <View style={[styles.base, style]}>
      {options.map((option) => {
        const isActive = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1} ellipsizeMode="tail">
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.xs,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
    height: 42,
    backgroundColor: colors.backgroundGlass,
    borderRadius: radius.full,
    borderColor: colors.borderActive,
    borderWidth: borderWidth.xs,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },

  itemActive: {
    backgroundColor: colors.accent,
  },

  label: {
    ...typo.smallSecondary,
  },

  labelActive: {
    ...typo.small,
    fontWeight: '700',
  },
});