import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import {
  useTheme,
  useThemePreference,
  type AppTokens,
  type ThemeMode,
} from '@/view/theme';

export type AppHeaderProps = {
  themeMode?: ThemeMode;
};

export const AppHeader = ({ themeMode }: AppHeaderProps) => {
  const activeTokens = useTheme(themeMode);
  const { setPreference } = useThemePreference();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  const isDark = activeTokens.mode === 'dark';

  return (
    <View style={styles.header}>
      <View style={styles.brandIdentity}>
        <View style={styles.brandBadge}>
          <MaterialCommunityIcons
            name="gamepad-variant"
            size={activeTokens.semantic.icon.md}
            color={activeTokens.semantic.color.onActionContainer}
          />
        </View>
        <Text allowFontScaling style={styles.brandTitle}>
          PG PLAY
        </Text>
      </View>

      <Pressable
        onPress={() => setPreference(isDark ? 'light' : 'dark')}
        onPressIn={keyboardFocus.onPressIn}
        onPressOut={keyboardFocus.onPressOut}
        onFocus={keyboardFocus.onFocus}
        onBlur={keyboardFocus.onBlur}
        accessibilityRole="button"
        accessibilityLabel={
          isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'
        }
        style={[styles.themeToggle, focusRingStyle]}
      >
        <MaterialCommunityIcons
          name={isDark ? 'weather-sunny' : 'weather-night'}
          size={activeTokens.semantic.icon.md}
          color={activeTokens.semantic.color.onSurface}
        />
      </Pressable>
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space } = activeTokens.semantic;
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.sm,
    },
    brandIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    brandBadge: {
      width: space['2xl'],
      height: space['2xl'],
      borderRadius: radius.md,
      backgroundColor: color.actionContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
    },
    themeToggle: {
      width: space['2xl'],
      height: space['2xl'],
      borderRadius: radius.full,
      backgroundColor: color.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
