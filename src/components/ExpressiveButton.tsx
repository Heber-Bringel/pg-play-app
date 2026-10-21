import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

export type Variant =
  | 'primary'
  | 'primaryJumbo'
  | 'successJumbo'
  | 'secondary'
  | 'tonal'
  | 'outlined';

export interface ExpressiveButtonProps {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: Variant;
  disabled?: boolean;
  onPress: () => void;
}

export function ExpressiveButton({
  label,
  icon,
  variant = 'primary',
  disabled = false,
  onPress,
}: ExpressiveButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const isJumbo = variant === 'primaryJumbo' || variant === 'successJumbo';

  const getBackgroundColor = () => {
    if (disabled) return tokens.component.button.bgDisabled;
    if (variant === 'successJumbo') return tokens.semantic.color.success;
    if (variant === 'secondary') return tokens.semantic.color.secondary;
    if (variant === 'tonal') return tokens.semantic.color.actionContainer;
    if (variant === 'outlined') return tokens.semantic.color.surfaceContainer;
    return pressed ? tokens.component.button.bgPressed : tokens.component.button.bg;
  };

  const getTextColor = () => {
    if (disabled) return tokens.component.button.labelDisabled;
    if (variant === 'successJumbo') return tokens.semantic.color.onSuccess;
    if (variant === 'secondary') return tokens.semantic.color.onSecondary;
    if (variant === 'tonal') return tokens.semantic.color.onActionContainer;
    if (variant === 'outlined') return tokens.semantic.color.onSurface;
    return tokens.component.button.label;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          minHeight: isJumbo
            ? tokens.component.button.jumboHeight
            : tokens.component.button.minHeight,
          paddingHorizontal: isJumbo ? tokens.semantic.space.xl : tokens.semantic.space.lg,
          backgroundColor: getBackgroundColor(),
          borderRadius: pressed
            ? tokens.component.button.radiusPressed
            : tokens.component.button.radius,
          borderColor:
            variant === 'outlined'
              ? tokens.semantic.color.outline
              : focused
              ? tokens.semantic.color.focus
              : tokens.semantic.color.transparent,
        },
      ]}
    >
      <View style={styles.content}>
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={tokens.semantic.icon.md}
            color={getTextColor()}
          />
        )}
        <Text
          allowFontScaling
          maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
          style={[styles.label, { color: getTextColor() }]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: tokens.semantic.border.thin,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  label: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    lineHeight: tokens.semantic.font.label.lineHeight,
  },
});
