import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, radius, spacing, typo } from '@/theme';

import { RadioItemProps } from '../RadioGroup.types';

import { TickCircle } from 'iconsax-react-nativejs';

export function RadioTile({ option, selected, onSelect }: RadioItemProps) {
  const isDisabled = option.disabled ?? false;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      accessibilityLabel={`${option.label} : ${option.description ?? option.value}`}
      onPress={() => !isDisabled && onSelect(option.value)}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        isDisabled && styles.tileDisabled,
        pressed && !isDisabled && styles.tilePressed,
      ]}
      disabled={isDisabled}
    >
      {selected && (
        <View style={styles.tickWrapper}>
          <TickCircle size="100%" color={colors.accent} variant='Bold' />
        </View>
      )}

      <Text style={typo.smallSecondary}>
        {option.label}
      </Text>
      <Text style={[typo.p, selected && [typo.pBold, styles.valueSelected], isDisabled && typo.pMuted]}>
        {option.description ?? option.value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'relative',
    borderWidth: borderWidth.md,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundCard,
    minWidth: 80,
    alignItems: 'flex-start',
  },
  tileSelected: {
    borderColor: colors.borderActive,
    backgroundColor: colors.backgroundGlass,
  },
  tileDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.transparent,
  },
  tilePressed: {
    opacity: 0.65,
  },

  tickWrapper: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },

  valueSelected: {
    color: colors.accent,
  },
});
