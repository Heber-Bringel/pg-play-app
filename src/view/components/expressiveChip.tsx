import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type ChipTone = 'neutral' | 'action' | 'success' | 'secondary' | 'error';

export type ExpressiveChipProps = {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: ChipTone;
  selected?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  flexGrow?: boolean;
  role?: 'button' | 'tab';
  themeMode?: ThemeMode;
  accessibilityLabel?: string;
  onPress: () => void;
};

export const ExpressiveChip = ({
  label,
  icon,
  tone = 'neutral',
  selected = false,
  disabled = false,
  fullWidth = false,
  flexGrow = false,
  role = 'button',
  themeMode,
  accessibilityLabel,
  onPress,
}: ExpressiveChipProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [pressed, setPressed] = useState(false);
  const keyboardFocus = useKeyboardFocus();

  const resolveColors = () => {
    if (disabled) {
      return {
        bg: activeTokens.component.chip.bg.disabled,
        border: activeTokens.component.chip.border.disabled,
        text: activeTokens.semantic.color.disabledText,
      };
    }

    if (selected) {
      if (tone === 'success') {
        return {
          bg: activeTokens.semantic.color.success,
          border: activeTokens.component.chip.border.success,
          text: activeTokens.semantic.color.onSuccess,
        };
      }
      if (tone === 'secondary') {
        return {
          bg: activeTokens.semantic.color.secondary,
          border: activeTokens.component.chip.border.secondary,
          text: activeTokens.semantic.color.onSecondary,
        };
      }
      if (tone === 'error') {
        return {
          bg: activeTokens.semantic.color.error,
          border: activeTokens.component.chip.border.error,
          text: activeTokens.semantic.color.onError,
        };
      }
      return {
        bg: activeTokens.component.chip.bg.selected,
        border: activeTokens.component.chip.border.selected,
        text: activeTokens.semantic.color.onActionContainer,
      };
    }

    if (tone === 'action') {
      return {
        bg: activeTokens.component.chip.bg.selected,
        border: activeTokens.component.chip.border.selected,
        text: activeTokens.semantic.color.onActionContainer,
      };
    }

    return {
      bg: pressed
        ? activeTokens.component.chip.bg.pressed
        : activeTokens.component.chip.bg.default,
      border: activeTokens.component.chip.border.default,
      text: activeTokens.semantic.color.onSurface,
    };
  };

  const palette = resolveColors();
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
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected }}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        flexGrow && styles.flexGrow,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: activeTokens.semantic.border.thin,
          borderRadius: pressed
            ? activeTokens.component.chip.radiusPressed
            : activeTokens.component.chip.radius,
        },
        focusRingStyle,
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={activeTokens.semantic.icon.sm}
          color={palette.text}
        />
      )}
      <Text
        allowFontScaling
        maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
        style={[styles.label, { color: palette.text }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    base: {
      minHeight: activeTokens.component.chip.minHeight,
      minWidth: activeTokens.component.chip.minWidth,
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingVertical: activeTokens.semantic.space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: activeTokens.semantic.space.xs,
    },
    fullWidth: {
      width: '100%',
    },
    flexGrow: {
      flex: 1,
    },
    label: {
      fontFamily: activeTokens.semantic.font.tag.family,
      fontSize: activeTokens.semantic.font.tag.size,
      lineHeight: activeTokens.semantic.font.tag.lineHeight,
      fontWeight: activeTokens.semantic.font.tag.weight,
    },
  });
