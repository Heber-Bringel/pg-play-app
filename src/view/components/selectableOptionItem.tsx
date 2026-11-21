import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type SelectableOptionItemProps = {
  label: string;
  index?: number;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  selected?: boolean;
  disabled?: boolean;
  error?: boolean;
  themeMode?: ThemeMode;
  accessibilityLabel?: string;
  onPress: () => void;
};

export const SelectableOptionItem = ({
  label,
  index,
  icon,
  selected = false,
  disabled = false,
  error = false,
  themeMode,
  accessibilityLabel,
  onPress,
}: SelectableOptionItemProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [pressed, setPressed] = useState(false);
  const keyboardFocus = useKeyboardFocus();

  const backgroundColor = disabled
    ? activeTokens.component.option.bg.disabled
    : error
      ? activeTokens.component.option.bg.error
      : selected
        ? activeTokens.component.option.bg.selected
        : activeTokens.component.option.bg.default;

  const borderColor = disabled
    ? activeTokens.component.option.border.disabled
    : error
      ? activeTokens.component.option.border.error
      : selected
        ? activeTokens.component.option.border.selected
        : activeTokens.component.option.border.default;

  const borderRadius =
    pressed || selected
      ? activeTokens.component.option.radiusPressed
      : activeTokens.component.option.radius;

  const labelColor = disabled
    ? activeTokens.semantic.color.disabledText
    : error
      ? activeTokens.semantic.color.onErrorContainer
      : selected
        ? activeTokens.semantic.color.onActionContainer
        : activeTokens.semantic.color.onSurface;

  const badgeBg = selected
    ? activeTokens.semantic.color.action
    : activeTokens.semantic.color.surfaceVariant;

  const badgeContentColor = selected
    ? activeTokens.semantic.color.onAction
    : activeTokens.semantic.color.onSurface;

  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    (index !== undefined ? `Selecionar jogador ${index}: ${label}` : label);

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
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityState={{ disabled, selected }}
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth: activeTokens.semantic.border.thin,
          borderRadius,
        },
        focusRingStyle,
      ]}
    >
      <View style={styles.leftGroup}>
        <View style={[styles.leadingBadge, { backgroundColor: badgeBg }]}>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={activeTokens.semantic.icon.sm}
              color={badgeContentColor}
            />
          ) : (
            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={[styles.indexText, { color: badgeContentColor }]}
            >
              {index !== undefined ? String(index) : ''}
            </Text>
          )}
        </View>
        <Text
          allowFontScaling
          style={[styles.optionLabel, { color: labelColor }]}
        >
          {label}
        </Text>
      </View>

      {selected && (
        <MaterialCommunityIcons
          name="check-circle"
          size={activeTokens.semantic.icon.md}
          color={activeTokens.semantic.color.action}
        />
      )}
    </Pressable>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    container: {
      minHeight: activeTokens.component.option.minHeight,
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingVertical: activeTokens.semantic.space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: activeTokens.semantic.space.sm,
    },
    leftGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    leadingBadge: {
      width: activeTokens.semantic.space.xl,
      height: activeTokens.semantic.space.xl,
      borderRadius: activeTokens.semantic.radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    indexText: {
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
    },
    optionLabel: {
      flex: 1,
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
    },
  });
