import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius } from '@/theme';

interface InputNumberProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  containerStyle?: ViewStyle;
}

export function InputNumber({
  value: initialValue = 1,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
  containerStyle,
}: InputNumberProps) {
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const clamped =
        min !== undefined && parsed < min ? min :
        max !== undefined && parsed > max ? max :
        parsed;
      setValue(clamped);
      onChange?.(clamped);
    }
    setDraft(null);
  };

  const decrement = () => {
    const next = value - step;
    if (min !== undefined && next < min) return;
    setValue(next);
    onChange?.(next);
  };

  const increment = () => {
    const next = value + step;
    if (max !== undefined && next > max) return;
    setValue(next);
    onChange?.(next);
  };

  const canDecrement = min === undefined || value - step >= min;
  const canIncrement = max === undefined || value + step <= max;

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={decrement}
        disabled={disabled || !canDecrement}
        style={styles.button}
        activeOpacity={0.6}
      >
        <Text style={[styles.operator, (disabled || !canDecrement) && styles.operatorDisabled]}>
          −
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.valueWrapper}
        activeOpacity={disabled ? 1 : 0.8}
        onPress={() => {
          if (disabled) return;
          setDraft(String(value));
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {draft !== null ? (
          <TextInput
            ref={inputRef}
            style={styles.value}
            value={draft}
            onChangeText={setDraft}
            onBlur={() => commit(draft)}
            onSubmitEditing={() => commit(draft)}
            keyboardType="numeric"
            returnKeyType="done"
            selectionColor={colors.accent}
            textAlign="center"
          />
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={increment}
        disabled={disabled || !canIncrement}
        style={styles.button}
        activeOpacity={0.6}
      >
        <Text style={[styles.operator, (disabled || !canIncrement) && styles.operatorDisabled]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  button: {
    padding: spacing.sm,
  },

  operator: {
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  operatorDisabled: {
    opacity: 0.3,
  },

  valueWrapper: {
    flex: 1,
    marginHorizontal: spacing.sm,
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.backgroundGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },

  value: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
