import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type NavDestinationKey = 'welcome' | 'games' | 'teams';

export type ShortNavigationBarProps = {
  activeKey: NavDestinationKey;
  onSelect: (key: NavDestinationKey) => void;
  themeMode?: ThemeMode;
};

type NavDestinationItem = {
  key: NavDestinationKey;
  label: string;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  inactiveIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  accessibilityLabel: string;
};

const NAV_DESTINATIONS: NavDestinationItem[] = [
  {
    key: 'welcome',
    label: 'Início',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
    accessibilityLabel: 'Ir para Início',
  },
  {
    key: 'games',
    label: 'Jogos',
    activeIcon: 'gamepad-variant',
    inactiveIcon: 'gamepad-variant-outline',
    accessibilityLabel: 'Ir para Jogos',
  },
  {
    key: 'teams',
    label: 'Equipes',
    activeIcon: 'account-group',
    inactiveIcon: 'account-group-outline',
    accessibilityLabel: 'Ir para Equipes',
  },
];

type NavTabButtonProps = {
  item: NavDestinationItem;
  isActive: boolean;
  activeTokens: AppTokens;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
};

const NavTabButton = ({
  item,
  isActive,
  activeTokens,
  styles,
  onPress,
}: NavTabButtonProps) => {
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="tab"
      accessibilityLabel={item.accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      style={[styles.item, focusRingStyle]}
    >
      <View style={[styles.indicator, isActive ? styles.indicatorActive : null]}>
        <MaterialCommunityIcons
          name={isActive ? item.activeIcon : item.inactiveIcon}
          size={activeTokens.semantic.icon.md}
          color={
            isActive
              ? activeTokens.component.navBar.activeIcon
              : activeTokens.component.navBar.inactiveIcon
          }
        />
      </View>
      <Text
        allowFontScaling
        maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
        style={[
          styles.label,
          isActive ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

export const ShortNavigationBar = ({
  activeKey,
  onSelect,
  themeMode,
}: ShortNavigationBarProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  return (
    <View accessibilityRole="tablist" style={styles.bar}>
      {NAV_DESTINATIONS.map((item) => (
        <NavTabButton
          key={item.key}
          item={item}
          isActive={activeKey === item.key}
          activeTokens={activeTokens}
          styles={styles}
          onPress={() => onSelect(item.key)}
        />
      ))}
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { font, space } = activeTokens.semantic;
  const { navBar } = activeTokens.component;
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: navBar.bg,
      borderTopWidth: navBar.borderWidth,
      borderTopColor: navBar.borderTop,
      paddingTop: space.sm,
      paddingBottom: space.md,
      paddingHorizontal: space.sm,
    },
    item: {
      flex: 1,
      minHeight: navBar.itemMinHeight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      borderRadius: navBar.radius,
    },
    indicator: {
      width: navBar.indicatorWidth,
      height: navBar.indicatorHeight,
      borderRadius: navBar.radius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indicatorActive: {
      backgroundColor: navBar.indicatorBg,
    },
    label: {
      fontSize: font.caption.size,
      lineHeight: font.caption.lineHeight,
      textAlign: 'center',
    },
    labelActive: {
      fontFamily: font.caption.family,
      fontWeight: font.caption.weight,
      color: navBar.activeLabel,
    },
    labelInactive: {
      fontFamily: font.body.family,
      fontWeight: font.body.weight,
      color: navBar.inactiveLabel,
    },
  });
};
