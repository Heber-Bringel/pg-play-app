import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

export interface GameCardProps {
  title: string;
  description: string;
  playersTag: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  highlightLeader?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function GameCard({
  title,
  description,
  playersTag,
  icon,
  highlightLeader = false,
  disabled = false,
  onPress,
}: GameCardProps) {
  const [pressed, setPressed] = useState(false);

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
            ? tokens.semantic.color.disabledBg
            : tokens.component.card.bg,
          borderColor: highlightLeader
            ? tokens.semantic.color.highlight
            : pressed
            ? tokens.semantic.color.action
            : tokens.component.card.border,
          borderRadius: pressed
            ? tokens.semantic.radius.md
            : tokens.component.card.radius,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name={icon}
            size={tokens.semantic.icon.lg}
            color={tokens.semantic.color.onActionContainer}
          />
        </View>
        <View style={styles.tag}>
          <Text allowFontScaling style={styles.tagText}>
            {playersTag}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text allowFontScaling style={styles.title}>
          {title}
        </Text>
        <Text allowFontScaling style={styles.description}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

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
    width: tokens.primitive.space.space56,
    height: tokens.primitive.space.space56,
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
    color: tokens.semantic.color.onSurface,
  },
  body: {
    gap: tokens.semantic.space.xs,
  },
  title: {
    fontFamily: tokens.semantic.font.subtitle.family,
    fontSize: tokens.semantic.font.subtitle.size,
    fontWeight: tokens.semantic.font.subtitle.weight,
    color: tokens.semantic.color.onSurface,
  },
  description: {
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
    color: tokens.semantic.color.onSurfaceMuted,
  },
});
