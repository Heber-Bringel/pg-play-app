import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type ExpressiveTextFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  helperText?: string;
  errorText?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  maxLength?: number;
  disabled?: boolean;
  themeMode?: ThemeMode;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
};

export const ExpressiveTextField = ({
  label,
  value,
  placeholder,
  helperText,
  errorText,
  icon = 'account-multiple-plus',
  maxLength = 20,
  disabled = false,
  themeMode,
  onChangeText,
  onSubmitEditing,
}: ExpressiveTextFieldProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text allowFontScaling style={styles.label}>
          {label}
        </Text>
        <Text allowFontScaling style={styles.counter}>
          {`${value.length}/${maxLength}`}
        </Text>
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: disabled
              ? activeTokens.semantic.color.disabledBg
              : hasError
                ? activeTokens.component.input.bgError
                : activeTokens.component.input.bg,
            borderColor: hasError
              ? activeTokens.component.input.borderError
              : focused
                ? activeTokens.component.input.borderFocus
                : activeTokens.component.input.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={activeTokens.semantic.icon.md}
          color={
            hasError
              ? activeTokens.semantic.color.error
              : activeTokens.semantic.color.onSurfaceMuted
          }
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={activeTokens.semantic.color.onSurfaceMuted}
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
                ? activeTokens.semantic.color.disabledText
                : activeTokens.component.input.text,
            },
          ]}
        />
      </View>

      {(hasError || helperText) && (
        <View style={styles.helperRow} accessibilityLiveRegion="polite">
          {hasError && (
            <MaterialCommunityIcons
              name="alert-circle"
              size={activeTokens.semantic.icon.sm}
              color={activeTokens.semantic.color.error}
            />
          )}
          <Text
            allowFontScaling
            style={[
              styles.helperText,
              {
                color: hasError
                  ? activeTokens.semantic.color.error
                  : activeTokens.semantic.color.onSurfaceMuted,
              },
            ]}
          >
            {hasError ? errorText : helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    container: {
      gap: activeTokens.semantic.space.sm,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      fontFamily: activeTokens.semantic.font.caption.family,
      fontSize: activeTokens.semantic.font.caption.size,
      fontWeight: activeTokens.semantic.font.caption.weight,
      lineHeight: activeTokens.semantic.font.caption.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    counter: {
      fontFamily: activeTokens.semantic.font.caption.family,
      fontSize: activeTokens.semantic.font.caption.size,
      fontWeight: activeTokens.semantic.font.caption.weight,
      lineHeight: activeTokens.semantic.font.caption.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
    inputWrapper: {
      minHeight: activeTokens.component.input.minHeight,
      borderRadius: activeTokens.component.input.radius,
      borderWidth: activeTokens.semantic.border.thin,
      paddingHorizontal: activeTokens.semantic.space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    input: {
      flex: 1,
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.body.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.xs,
    },
    helperText: {
      fontFamily: activeTokens.semantic.font.caption.family,
      fontSize: activeTokens.semantic.font.caption.size,
      fontWeight: activeTokens.semantic.font.caption.weight,
      lineHeight: activeTokens.semantic.font.caption.lineHeight,
    },
  });
