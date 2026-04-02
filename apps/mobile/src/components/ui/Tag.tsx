import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

interface TagProps {
  title: string;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Tag({
  title,
  variant = 'primary',
  icon,
  style,
  textStyle,
}: TagProps) {

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          typo.small,
          variantTextStyles[variant],
          icon ? { marginLeft: spacing.sm } : undefined,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    borderRadius: radius.full,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.errorDark,
    borderWidth: borderWidth.md,
    borderColor: colors.error,
  },
  outline: {
    backgroundColor: colors.backgroundGlass,
    borderWidth: borderWidth.md,
    borderColor: colors.borderActive,
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.white,
  },
  secondary: {
    color: colors.white,
  },
  danger: {
    color: colors.error,
  },
  outline: {
    color: colors.textPrimary,
  },
};