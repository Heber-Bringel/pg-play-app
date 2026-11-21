import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type ExpressiveTimerProps = {
  secondsRemaining: number;
  themeMode?: ThemeMode;
};

export const ExpressiveTimer = ({
  secondsRemaining,
  themeMode,
}: ExpressiveTimerProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const safeSeconds = Math.max(0, Math.floor(secondsRemaining));
  const isCritical = safeSeconds <= 10;
  const isExpired = safeSeconds === 0;
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');
  const iconName = isExpired
    ? 'bell-ring'
    : isCritical
      ? 'alert'
      : 'timer-outline';

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCritical && !isExpired) {
      scaleAnim.setValue(1.08);
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: activeTokens.semantic.motion.spring.spatial.damping,
        stiffness: activeTokens.semantic.motion.spring.spatial.stiffness,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [
    safeSeconds,
    isCritical,
    isExpired,
    scaleAnim,
    activeTokens.semantic.motion.spring.spatial.damping,
    activeTokens.semantic.motion.spring.spatial.stiffness,
  ]);

  const bgColor = isCritical
    ? activeTokens.component.timer.bg.critical
    : activeTokens.component.timer.bg.normal;
  const textColor = isCritical
    ? activeTokens.component.timer.text.critical
    : activeTokens.component.timer.text.normal;
  const borderRadius = isCritical
    ? activeTokens.component.timer.radius.critical
    : activeTokens.component.timer.radius.normal;

  return (
    <Animated.View
      accessibilityRole="timer"
      accessibilityLabel={
        isExpired ? 'Tempo esgotado' : `Tempo restante: ${safeSeconds} segundos`
      }
      accessibilityLiveRegion={isCritical ? 'assertive' : 'none'}
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderRadius,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={activeTokens.semantic.icon.md}
        color={textColor}
      />
      <Text
        allowFontScaling
        maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
        style={[styles.timeText, { color: textColor }]}
      >
        {`${minutes}:${seconds}`}
      </Text>
    </Animated.View>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    container: {
      alignSelf: 'center',
      justifyContent: 'center',
      minHeight: activeTokens.semantic.space['2xl'],
      paddingHorizontal: activeTokens.semantic.space.lg,
      paddingVertical: activeTokens.semantic.space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    timeText: {
      fontFamily: activeTokens.semantic.font.title.family,
      fontSize: activeTokens.semantic.font.title.size,
      fontWeight: activeTokens.semantic.font.title.weight,
      lineHeight: activeTokens.semantic.font.title.lineHeight,
    },
  });
