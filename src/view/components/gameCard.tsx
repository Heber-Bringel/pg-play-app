import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveTag, type TagTone } from '@/view/components/expressiveTag';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type GameCardProps = {
  title: string;
  description: string;
  playersTag: string;
  playersTagTone?: TagTone;
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
  playersTagTone,
  icon,
  highlightLeader = false,
  disabled = false,
  themeMode,
  onPress,
}: GameCardProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const [pressed, setPressed] = useState(false);
  const keyboardFocus = useKeyboardFocus();

  const resolvedTagTone: TagTone =
    playersTagTone ?? (highlightLeader ? 'highlight' : 'neutral');
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
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
            ? activeTokens.component.card.borderLeader
            : pressed
              ? activeTokens.component.card.borderPressed
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
        focusRingStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name={icon}
            size={activeTokens.semantic.icon.lg}
            color={activeTokens.semantic.color.onActionContainer}
          />
        </View>
        <ExpressiveTag
          label={playersTag}
          tone={resolvedTagTone}
          themeMode={themeMode}
        />
      </View>

      <View style={styles.body}>
        <Text
          allowFontScaling
          style={[
            styles.title,
            disabled && { color: activeTokens.semantic.color.disabledText },
          ]}
        >
          {title}
        </Text>
        <Text
          allowFontScaling
          style={[
            styles.description,
            disabled && { color: activeTokens.semantic.color.disabledText },
          ]}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    card: {
      padding: activeTokens.component.card.padding,
      borderWidth: activeTokens.semantic.border.thin,
      gap: activeTokens.semantic.space.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: activeTokens.semantic.space.sm,
      flexWrap: 'wrap',
    },
    badge: {
      width: activeTokens.component.card.badgeSize,
      height: activeTokens.component.card.badgeSize,
      borderRadius: activeTokens.semantic.radius.lg,
      backgroundColor: activeTokens.semantic.color.actionContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      gap: activeTokens.semantic.space.xs,
    },
    title: {
      fontFamily: activeTokens.semantic.font.subtitle.family,
      fontSize: activeTokens.semantic.font.subtitle.size,
      fontWeight: activeTokens.semantic.font.subtitle.weight,
      lineHeight: activeTokens.semantic.font.subtitle.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    description: {
      fontFamily: activeTokens.semantic.font.body.family,
      fontSize: activeTokens.semantic.font.body.size,
      fontWeight: activeTokens.semantic.font.body.weight,
      lineHeight: activeTokens.semantic.font.body.lineHeight,
      color: activeTokens.semantic.color.onSurfaceMuted,
    },
  });
