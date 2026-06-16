import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TickCircle } from 'iconsax-react-nativejs';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

interface SelectableRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  selected: boolean;
  onPress: () => void;
  /** Tight list row (no per-row card, hairline divider) instead of a spaced card */
  compact?: boolean;
}

export function SelectableRow({
  title,
  subtitle,
  icon,
  iconBg,
  selected,
  onPress,
  compact = false,
}: SelectableRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.card,
        selected && (compact ? styles.compactSelected : styles.cardSelected),
        pressed && styles.pressed,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconWrapper,
            compact && styles.iconWrapperCompact,
            iconBg ? { backgroundColor: iconBg } : null,
          ]}
        >
          {icon}
        </View>
      )}

      <View style={styles.textBlock}>
        <Text style={[typo.pBold, compact ? styles.titleCompact : styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={typo.smallSecondary} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {selected && <TickCircle size={compact ? 22 : 24} color={colors.accent} variant="Bold" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Spaced card variant
  card: {
    gap: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.md,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardSelected: {
    borderColor: colors.borderActive,
    backgroundColor: colors.backgroundGlass,
  },
  // Tight list variant (dividers handled by the parent group container)
  compact: {
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  compactSelected: {
    backgroundColor: colors.backgroundGlass,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapperCompact: {
    width: 34,
    height: 34,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 18,
    marginBottom: 0,
  },
  titleCompact: {
    fontSize: 16,
    marginBottom: 0,
  },
});
