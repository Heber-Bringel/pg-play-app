import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '@/view/theme';

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
  accessibilityLabel,
  onPress,
}: ExpressiveChipProps) => {
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const resolveColors = () => {
    if (disabled) {
      return {
        bg: tokens.semantic.color.disabledBg,
        border: tokens.semantic.color.outline,
        text: tokens.semantic.color.disabledText,
      };
    }

    if (selected) {
      if (tone === 'success') {
        return {
          bg: tokens.semantic.color.success,
          border: tokens.semantic.color.success,
          text: tokens.semantic.color.onSuccess,
        };
      }
      if (tone === 'secondary') {
        return {
          bg: tokens.semantic.color.secondary,
          border: tokens.semantic.color.secondary,
          text: tokens.semantic.color.onSecondary,
        };
      }
      if (tone === 'error') {
        return {
          bg: tokens.semantic.color.error,
          border: tokens.semantic.color.error,
          text: tokens.semantic.color.onError,
        };
      }
      return {
        bg: tokens.semantic.color.actionContainer,
        border: tokens.semantic.color.action,
        text: tokens.semantic.color.onActionContainer,
      };
    }

    if (tone === 'action') {
      return {
        bg: tokens.semantic.color.actionContainer,
        border: tokens.semantic.color.action,
        text: tokens.semantic.color.onActionContainer,
      };
    }

    return {
      bg: pressed
        ? tokens.semantic.color.surfaceVariant
        : tokens.semantic.color.surfaceContainer,
      border: tokens.semantic.color.outline,
      text: tokens.semantic.color.onSurface,
    };
  };

  const palette = resolveColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected }}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        flexGrow && styles.flexGrow,
        {
          backgroundColor: palette.bg,
          borderColor: focused ? tokens.semantic.color.focus : palette.border,
          borderWidth: focused
            ? tokens.semantic.border.focus
            : tokens.semantic.border.thin,
          borderRadius: pressed
            ? tokens.semantic.radius.md
            : tokens.semantic.radius.full,
        },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={tokens.semantic.icon.sm}
          color={palette.text}
        />
      )}
      <Text
        allowFontScaling
        maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
        style={[styles.label, { color: palette.text }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: tokens.semantic.space['2xl'],
    minWidth: tokens.semantic.space['3xl'],
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.semantic.space.xs,
  },
  fullWidth: {
    width: '100%',
  },
  flexGrow: {
    flex: 1,
  },
  label: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
  },
});
