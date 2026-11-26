import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type TagTone =
  | 'neutral'
  | 'action'
  | 'secondary'
  | 'success'
  | 'error'
  | 'highlight';

export type ExpressiveTagProps = {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: TagTone;
  themeMode?: ThemeMode;
  accessibilityLabel?: string;
};

export const ExpressiveTag = ({
  label,
  icon,
  tone = 'neutral',
  themeMode,
  accessibilityLabel,
}: ExpressiveTagProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const palette = activeTokens.component.tag[tone];

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.container,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
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
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.xs,
      paddingHorizontal: activeTokens.semantic.space.sm,
      paddingVertical: activeTokens.semantic.space.xs,
      borderRadius: activeTokens.component.tag.radius,
      borderWidth: activeTokens.semantic.border.thin,
    },
    label: {
      fontFamily: activeTokens.semantic.font.tag.family,
      fontSize: activeTokens.semantic.font.tag.size,
      fontWeight: activeTokens.semantic.font.tag.weight,
      lineHeight: activeTokens.semantic.font.tag.lineHeight,
    },
  });
