import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTokens, tokens, type ThemeMode } from '@/view/theme';

export type GameCardProps = {
  title: string;
  description: string;
  playersTag: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  highlightLeader?: boolean;
  disabled?: boolean;
  themeMode?: ThemeMode;
  onPress?: () => void;
};

export const GameCard = ({
  title,
  description,
  playersTag,
  icon,
  highlightLeader = false,
  disabled = false,
  themeMode = 'light',
  onPress,
}: GameCardProps) => {
  const [pressed, setPressed] = useState(false);
  const activeTokens = themeMode === 'dark' ? darkTokens : tokens;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessible
      accessibilityRole={onPress ? 'button' : 'summary'}
      accessibilityLabel={`${title}. ${playersTag}. ${description}`}
      accessibilityState={{ disabled }}
      style={[
        styles.card,
        {
          backgroundColor: disabled
            ? activeTokens.semantic.color.disabledBg
            : activeTokens.component.card.bg,
          borderColor: highlightLeader
            ? activeTokens.semantic.color.highlight
            : pressed
            ? activeTokens.semantic.color.action
            : activeTokens.component.card.border,
          borderRadius: pressed
            ? activeTokens.semantic.radius.md
            : activeTokens.component.card.radius,
          elevation: disabled
            ? activeTokens.semantic.elevation.none
            : highlightLeader
            ? activeTokens.semantic.elevation.floating
            : activeTokens.semantic.elevation.card,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            { backgroundColor: activeTokens.semantic.color.actionContainer },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={activeTokens.semantic.icon.lg}
            color={activeTokens.semantic.color.onActionContainer}
          />
        </View>
        <View
          style={[
            styles.tag,
            { backgroundColor: activeTokens.semantic.color.surfaceVariant },
          ]}
        >
          <Text
            allowFontScaling
            style={[
              styles.tagText,
              { color: activeTokens.semantic.color.onSurface },
            ]}
          >
            {playersTag}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text
          allowFontScaling
          style={[
            styles.title,
            { color: activeTokens.semantic.color.onSurface },
          ]}
        >
          {title}
        </Text>
        <Text
          allowFontScaling
          style={[
            styles.description,
            { color: activeTokens.semantic.color.onSurfaceMuted },
          ]}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: tokens.component.card.padding,
    borderWidth: tokens.semantic.border.thin,
    gap: tokens.semantic.space.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    width: tokens.component.card.badgeSize,
    height: tokens.component.card.badgeSize,
    borderRadius: tokens.semantic.radius.lg,
    backgroundColor: tokens.semantic.color.actionContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: tokens.semantic.space.sm,
    paddingVertical: tokens.semantic.space.xs,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
  },
  tagText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    fontWeight: tokens.semantic.font.caption.weight,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    color: tokens.semantic.color.onSurface,
  },
  body: {
    gap: tokens.semantic.space.xs,
  },
  title: {
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    fontWeight: tokens.semantic.font.subtitle.weight,
    lineHeight: tokens.semantic.font.subtitle.lineHeight,
    color: tokens.semantic.color.onSurface,
  },
  description: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    fontWeight: tokens.semantic.font.body.weight,
    lineHeight: tokens.semantic.font.body.lineHeight,
    color: tokens.semantic.color.onSurfaceMuted,
  },
});
