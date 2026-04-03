import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, typo } from '@/theme';

type InputType   = 'text' | 'password' | 'email' | 'search' | 'textarea';

interface InputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label? : string;
  placeholder? : string;
  error? : string;
  hint? : string;

  iconLeft? : React.ReactNode;
  iconRight? : React.ReactNode;

  type? : InputType;
  disabled? : boolean;

  onChangeText?: (value: string) => void

  containerStyle? : ViewStyle;
}

const TYPE_CONFIG: Record<InputType, Partial<TextInputProps>> = {
  text:     {},
  password: { secureTextEntry: true, autoCapitalize: 'none' },
  email:    { keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' },
  search:   { returnKeyType: 'search', clearButtonMode: 'while-editing' },
  textarea: {
    multiline: true,
    numberOfLines: 4,
    textAlignVertical: 'top',
  },
};

export function Input({
  label,
  placeholder,
  error,
  hint,

  iconLeft,
  iconRight,

  type = 'text',
  disabled = false,

  style,
  containerStyle,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const typeProps  = TYPE_CONFIG[type];

  // For password, we generate secureTextEntry manually
  const { secureTextEntry: _, ...safeTypeProps } = typeProps;

  return (
    <View style={[styles.container, containerStyle]}>

      {/* Label */}
      {label && (
        <Text style={[typo.small, styles.label, disabled && styles.textDisabled]}>
          {label}
        </Text>
      )}

      {/* Wrapper */}
      <View
        style={[
          styles.inputWrapper,
          type === 'textarea' ? styles.textarea : styles.default,
          isFocused && !disabled && styles.focused,
          !!error   && styles.hasError,
          disabled  && styles.wrapperDisabled,
        ]}
      >
        {/* Left icon */}
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

        {/* Input */}
        <TextInput
          style={[typo.p, styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...safeTypeProps}
          {...props}
        />

        {/* Toggle password */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
            disabled={disabled}
          >
            <Text style={[typo.small, styles.toggleText]}>
              {showPassword ? 'Masquer' : 'Voir'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Right icon (if no password) */}
        {!isPassword && iconRight && (
          <View style={styles.iconRight}>{iconRight}</View>
        )}
      </View>

      {/* Error or hint */}
      {error
        ? <Text style={[typo.small, styles.error]}>{error}</Text>
        : hint && <Text style={[typo.small, styles.hint]}>{hint}</Text>
      }

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: spacing.xs,
  },

  // Wrapper
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.backgroundGlass,
  },

  // Type
  default: {
    height: 48,
    borderRadius: radius.full,
  },
  textarea: {
    height: undefined,
    minHeight: 100,
    borderRadius: radius.lg,
    alignItems: 'flex-start',
  },

  // States
  focused: {

  },
  hasError: {
    backgroundColor: colors.errorDark,
    borderColor: colors.error,
  },
  wrapperDisabled: {
    opacity: 0.5,
  },

  // Input
  input: {
    flex: 1,
    color: colors.textPrimary,
  },

  // Icons
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },

  // Texts
  toggleText: {
    color: colors.accent,
  },
  error: {
    color: colors.error,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  textDisabled: {
    opacity: 0.5,
  },
});