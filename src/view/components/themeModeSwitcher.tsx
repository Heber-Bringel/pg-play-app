import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemePreference } from '@/model/entities/themePreference';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { ExpressiveChip } from '@/view/components/expressiveChip';
import { ExpressiveTag } from '@/view/components/expressiveTag';
import { useTheme, type AppTokens } from '@/view/theme';

type ThemeOptionItem = {
  value: ThemePreference;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const THEME_OPTIONS: ThemeOptionItem[] = [
  { value: 'auto', label: 'Automático', icon: 'theme-light-dark' },
  { value: 'light', label: 'Claro', icon: 'weather-sunny' },
  { value: 'dark', label: 'Escuro', icon: 'weather-night' },
];

function getThemeOption(preference: ThemePreference): ThemeOptionItem {
  return (
    THEME_OPTIONS.find((item) => item.value === preference) ?? THEME_OPTIONS[0]
  );
}

export type ThemeModeToggleButtonProps = {
  preference: ThemePreference;
  expanded: boolean;
  onPress: () => void;
};

export const ThemeModeToggleButton = ({
  preference,
  expanded,
  onPress,
}: ThemeModeToggleButtonProps) => {
  const currentOption = getThemeOption(preference);

  return (
    <ExpressiveButton
      variant="icon"
      icon={currentOption.icon}
      accessibilityLabel={`Tema: ${currentOption.label}. ${
        expanded ? 'Minimizar opções de tema' : 'Expandir opções de tema'
      }`}
      accessibilityExpanded={expanded}
      onPress={onPress}
    />
  );
};

export type ThemeModePanelProps = {
  preference: ThemePreference;
  onSelectPreference: (preference: ThemePreference) => void;
  onMinimize: () => void;
};

export const ThemeModePanel = ({
  preference,
  onSelectPreference,
  onMinimize,
}: ThemeModePanelProps) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const currentOption = getThemeOption(preference);

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons
            name={currentOption.icon}
            size={activeTokens.semantic.icon.md}
            color={activeTokens.semantic.color.action}
          />
          <Text allowFontScaling style={styles.title}>
            Tema
          </Text>
          <ExpressiveTag label={currentOption.label} tone="action" />
        </View>
        <ExpressiveButton
          variant="icon"
          icon="chevron-up"
          accessibilityLabel="Minimizar opções de tema"
          onPress={onMinimize}
        />
      </View>

      <View style={styles.chipsRow}>
        {THEME_OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <ExpressiveChip
              key={option.value}
              label={option.label}
              icon={selected ? 'check-circle' : option.icon}
              selected={selected}
              accessibilityLabel={`Selecionar tema ${option.label}`}
              onPress={() => onSelectPreference(option.value)}
            />
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border, elevation } = activeTokens.semantic;
  const { card } = activeTokens.component;
  return StyleSheet.create({
    panel: {
      backgroundColor: card.bg,
      borderColor: card.border,
      borderWidth: border.thin,
      borderRadius: radius.lg,
      padding: space.md,
      gap: space.sm,
      elevation: elevation.card,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.sm,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      flexWrap: 'wrap',
      flex: 1,
    },
    title: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: color.onSurface,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.sm,
    },
  });
};
