import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, radius, fontSize, borderWidth } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <>
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' ? colors.accent : colors.white}
            size="small"
          />
        ) : (
          icon
        )}
        <Text
          style={[
            styles.text,
            variantTextStyles[variant],
            icon ? { marginLeft: spacing.sm } : undefined,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    display: 'flex',
    gap: spacing.sm,
    opacity: 0.5,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
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
  ghost: {
    backgroundColor: colors.transparent,
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
  ghost: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
};
