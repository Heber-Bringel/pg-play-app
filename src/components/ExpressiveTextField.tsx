import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

export interface ExpressiveTextFieldProps {
  label: string;
  value: string;
  placeholder: string;
  helperText?: string;
  errorText?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  maxLength?: number;
  disabled?: boolean;
  onChangeText: (text: string) => void;
}

export function ExpressiveTextField({
  label,
  value,
  placeholder,
  helperText,
  errorText,
  icon = 'account-multiple-plus',
  maxLength = 20,
  disabled = false,
  onChangeText,
}: ExpressiveTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text allowFontScaling style={styles.label}>
          {label}
        </Text>
        <Text allowFontScaling style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: disabled
              ? tokens.semantic.color.disabledBg
              : hasError
              ? tokens.component.input.bgError
              : tokens.component.input.bg,
            borderColor: hasError
              ? tokens.component.input.borderError
              : focused
              ? tokens.component.input.borderFocus
              : tokens.component.input.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={tokens.semantic.icon.md}
          color={
            hasError
              ? tokens.semantic.color.error
              : tokens.semantic.color.onSurfaceMuted
          }
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.semantic.color.onSurfaceMuted}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled }}
          style={[
            styles.input,
            {
              color: disabled
                ? tokens.semantic.color.disabledText
                : hasError
                ? tokens.semantic.color.onErrorContainer
                : tokens.component.input.text,
            },
          ]}
        />
      </View>

      {(hasError || helperText) && (
        <View style={styles.helperRow} accessibilityLiveRegion="polite">
          {hasError && (
            <MaterialCommunityIcons
              name="alert-circle"
              size={tokens.semantic.icon.sm}
              color={tokens.semantic.color.error}
            />
          )}
          <Text
            allowFontScaling
            style={[
              styles.helperText,
              {
                color: hasError
                  ? tokens.semantic.color.error
                  : tokens.semantic.color.onSurfaceMuted,
              },
            ]}
          >
            {hasError ? errorText : helperText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurface,
  },
  counter: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  inputWrapper: {
    minHeight: tokens.component.input.minHeight,
    borderRadius: tokens.component.input.radius,
    borderWidth: tokens.semantic.border.thin,
    paddingHorizontal: tokens.semantic.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  input: {
    flex: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  helperText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    fontWeight: tokens.semantic.font.caption.weight,
  },
});
