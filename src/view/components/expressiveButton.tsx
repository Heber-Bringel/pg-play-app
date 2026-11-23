import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type ButtonVariant =
  | 'primary'
  | 'primaryJumbo'
  | 'successJumbo'
  | 'tonalJumbo'
  | 'secondary'
  | 'tonal'
  | 'outlined'
  | 'text'
  | 'icon';

export type ButtonTone = 'default' | 'danger';

export type ExpressiveButtonProps = {
  label?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  disabled?: boolean;
  themeMode?: ThemeMode;
  accessibilityLabel?: string;
  onPress: () => void;
};

export const ExpressiveButton = ({
  label = '',
  icon,
  variant = 'primary',
  tone = 'default',
  disabled = false,
  themeMode,
  accessibilityLabel,
  onPress,
}: ExpressiveButtonProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [pressed, setPressed] = useState(false);
  const keyboardFocus = useKeyboardFocus();

  const isJumbo =
    variant === 'primaryJumbo' ||
    variant === 'successJumbo' ||
    variant === 'tonalJumbo';
  const isIconOnly = variant === 'icon';
  const isTextOnly = variant === 'text';

  const getBackgroundColor = () => {
    if (disabled) {
      if (isTextOnly || isIconOnly) {
        return activeTokens.semantic.color.transparent;
      }
      return activeTokens.component.button.bgDisabled;
    }
    if (isIconOnly) {
      if (pressed) {
        return tone === 'danger'
          ? activeTokens.semantic.color.errorContainer
          : activeTokens.semantic.color.surfaceVariant;
      }
      return activeTokens.semantic.color.transparent;
    }
    if (isTextOnly) {
      return pressed
        ? activeTokens.semantic.color.surfaceVariant
        : activeTokens.semantic.color.transparent;
    }
    if (variant === 'successJumbo') return activeTokens.semantic.color.success;
    if (variant === 'secondary') return activeTokens.semantic.color.secondary;
    if (variant === 'tonal' || variant === 'tonalJumbo') {
      return activeTokens.semantic.color.actionContainer;
    }
    if (variant === 'outlined') return activeTokens.semantic.color.surfaceContainer;
    return pressed
      ? activeTokens.component.button.bgPressed
      : activeTokens.component.button.bg;
  };

  const getTextColor = () => {
    if (disabled) return activeTokens.component.button.labelDisabled;
    if (isIconOnly) {
      return tone === 'danger'
        ? activeTokens.semantic.color.error
        : activeTokens.semantic.color.onSurface;
    }
    if (isTextOnly) {
      return tone === 'danger'
        ? activeTokens.semantic.color.error
        : activeTokens.semantic.color.action;
    }
    if (variant === 'successJumbo') return activeTokens.semantic.color.onSuccess;
    if (variant === 'secondary') return activeTokens.semantic.color.onSecondary;
    if (variant === 'tonal' || variant === 'tonalJumbo') {
      return activeTokens.semantic.color.onActionContainer;
    }
    if (variant === 'outlined') return activeTokens.semantic.color.onSurface;
    return activeTokens.component.button.label;
  };

  const contentColor = getTextColor();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        setPressed(true);
        keyboardFocus.onPressIn();
      }}
      onPressOut={() => {
        setPressed(false);
        keyboardFocus.onPressOut();
      }}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          minHeight: isJumbo
            ? activeTokens.component.button.jumbo.height
            : activeTokens.component.button.minHeight,
          minWidth: isIconOnly
            ? activeTokens.component.button.iconSize
            : undefined,
          width: isIconOnly
            ? activeTokens.component.button.iconSize
            : undefined,
          height: isIconOnly
            ? activeTokens.component.button.iconSize
            : undefined,
          paddingHorizontal: isIconOnly
            ? 0
            : isJumbo
              ? activeTokens.semantic.space.xl
              : isTextOnly
                ? activeTokens.semantic.space.md
                : activeTokens.semantic.space.lg,
          backgroundColor: getBackgroundColor(),
          borderRadius: pressed
            ? activeTokens.component.button.radiusPressed
            : activeTokens.component.button.radius,
          borderWidth: activeTokens.semantic.border.thin,
          borderColor:
            variant === 'outlined'
              ? activeTokens.component.button.border.outlined
              : activeTokens.semantic.color.transparent,
          elevation:
            disabled || variant === 'outlined' || isTextOnly || isIconOnly
              ? activeTokens.semantic.elevation.none
              : activeTokens.semantic.elevation.card,
        },
        focusRingStyle,
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={activeTokens.semantic.icon.md}
            color={contentColor}
          />
        )}
        {!isIconOnly && label.length > 0 && (
          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
            style={[styles.label, { color: contentColor }]}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    base: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    label: {
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
    },
  });
