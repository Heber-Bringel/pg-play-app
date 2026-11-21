import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTokens, tokens, type ThemeMode } from '@/view/theme';

export type SelectableOptionItemProps = {
  label: string;
  index?: number;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  selected?: boolean;
  disabled?: boolean;
  themeMode?: ThemeMode;
  reduceMotion?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
};

export const SelectableOptionItem = ({
  label,
  index,
  icon,
  selected = false,
  disabled = false,
  themeMode = 'light',
  reduceMotion = false,
  accessibilityLabel,
  onPress,
}: SelectableOptionItemProps) => {
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const activeTokens = themeMode === 'dark' ? darkTokens : tokens;

  useEffect(() => {
    if (selected && !reduceMotion) {
      scaleAnim.setValue(0.97);
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: activeTokens.semantic.motion.spring.effects.damping,
        stiffness: activeTokens.semantic.motion.spring.effects.stiffness,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [
    activeTokens.semantic.motion.spring.effects.damping,
    activeTokens.semantic.motion.spring.effects.stiffness,
    reduceMotion,
    scaleAnim,
    selected,
  ]);

  const backgroundColor = disabled
    ? activeTokens.semantic.color.disabledBg
    : selected
    ? activeTokens.semantic.color.actionContainer
    : activeTokens.component.quiz.optionBg;

  const borderColor = focused
    ? activeTokens.semantic.color.focus
    : selected
    ? activeTokens.semantic.color.action
    : activeTokens.component.quiz.optionBorder;

  const borderWidth = focused
    ? activeTokens.semantic.border.focus
    : activeTokens.semantic.border.thin;

  const borderRadius =
    pressed || selected
      ? activeTokens.semantic.radius.md
      : activeTokens.component.quiz.optionRadius;

  const labelColor = disabled
    ? activeTokens.semantic.color.disabledText
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityRole="button"
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityState={{ disabled, selected }}
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor,
            borderWidth,
            borderRadius,
          },
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: tokens.component.quiz.minHeight,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.semantic.space.sm,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  leadingBadge: {
    width: tokens.semantic.space.xl,
    height: tokens.semantic.space.xl,
    borderRadius: tokens.semantic.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    lineHeight: tokens.semantic.font.label.lineHeight,
  },
  optionLabel: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    lineHeight: tokens.semantic.font.label.lineHeight,
  },
});
