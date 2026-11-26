import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from "@/view/components/useKeyboardFocus";
import {
  useSoundPreference,
  useTheme,
  useThemePreference,
  type AppTokens,
  type ThemeMode,
} from "@/view/theme";

export type AppHeaderProps = {
  themeMode?: ThemeMode;
};

type HeaderIconButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accessibilityLabel: string;
  onPress: () => void;
  activeTokens: AppTokens;
};

const HeaderIconButton = ({
  icon,
  accessibilityLabel,
  onPress,
  activeTokens,
}: HeaderIconButtonProps) => {
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const keyboardFocus = useKeyboardFocus();
  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible,
  );

  return (
    <Pressable
      onPress={onPress}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.iconButton, focusRingStyle]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={activeTokens.semantic.icon.md}
        color={activeTokens.semantic.color.onSurface}
      />
    </Pressable>
  );
};

export const AppHeader = ({ themeMode }: AppHeaderProps) => {
  const activeTokens = useTheme(themeMode);
  const { setPreference } = useThemePreference();
  const { soundEnabled, toggleSoundEnabled } = useSoundPreference();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const isDark = activeTokens.mode === "dark";

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

      <View style={styles.actions}>
        <HeaderIconButton
          icon={soundEnabled ? "volume-high" : "volume-off"}
          accessibilityLabel={
            soundEnabled
              ? "Som do jogo: Ligado. Toque para desligar o som"
              : "Som do jogo: Desligado. Toque para ligar o som"
          }
          onPress={toggleSoundEnabled}
          activeTokens={activeTokens}
        />
        <HeaderIconButton
          icon={isDark ? "weather-sunny" : "weather-night"}
          accessibilityLabel={
            isDark ? "Alternar para tema claro" : "Alternar para tema escuro"
          }
          onPress={() => setPreference(isDark ? "light" : "dark")}
          activeTokens={activeTokens}
        />
      </View>
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space } = activeTokens.semantic;
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space.sm,
    },
    brandIdentity: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.sm,
    },
    brandBadge: {
      width: space["2xl"],
      height: space["2xl"],
      borderRadius: radius.md,
      backgroundColor: color.actionContainer,
      alignItems: "center",
      justifyContent: "center",
    },
    brandTitle: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.sm,
    },
    iconButton: {
      width: space["2xl"],
      height: space["2xl"],
      borderRadius: radius.full,
      backgroundColor: color.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
