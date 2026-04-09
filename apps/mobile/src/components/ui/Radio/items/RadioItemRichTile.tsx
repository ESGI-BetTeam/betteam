import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, radius, spacing, typo } from '@/theme';

import { RadioItemProps } from '../RadioGroup.types';

import { TickCircle } from 'iconsax-react-nativejs';

export function RadioRichTile({ option, selected, onSelect }: RadioItemProps) {
  const isDisabled = option.disabled ?? false;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      accessibilityLabel={`${option.description ?? option.value} — ${option.label}`}
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

      {option.icon && (
        <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
          <option.icon
            size="100%"
            color={isDisabled ? colors.accentMedium : colors.accent}
            variant={selected ? 'Bold' : 'Bulk'}
          />
        </View>
      )}

      <View style={styles.textBlock}>
        <Text style={[typo.p, selected && [typo.pBold, styles.valueSelected], isDisabled && typo.pMuted]}>
          {option.description ?? option.value}
        </Text>
        <Text style={typo.smallSecondary}>
          {option.label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    position: 'relative',
    borderWidth: borderWidth.md,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.backgroundCard,
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

  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapperSelected: {
  },

  textBlock: {
    flex: 1,
    gap: 1,
  },
  valueSelected: {
    color: colors.accent,
  },
});
