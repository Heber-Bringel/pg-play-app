import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '@/view/theme';

export type ExpressiveTimerProps = {
  secondsRemaining: number;
};

export const ExpressiveTimer = ({ secondsRemaining }: ExpressiveTimerProps) => {
  const safeSeconds = Math.max(0, Math.floor(secondsRemaining));
  const isCritical = safeSeconds <= 10;
  const isExpired = safeSeconds === 0;
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');
  const iconName = isExpired ? 'bell-ring' : isCritical ? 'alert' : 'timer-outline';

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCritical && !isExpired) {
      scaleAnim.setValue(1.08);
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: tokens.semantic.motion.spring.spatial.damping,
        stiffness: tokens.semantic.motion.spring.spatial.stiffness,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [safeSeconds, isCritical, isExpired, scaleAnim]);

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
          backgroundColor: isCritical
            ? tokens.component.timer.bgCritical
            : tokens.component.timer.bgNormal,
          borderRadius: isCritical
            ? tokens.component.timer.radiusCritical
            : tokens.component.timer.radiusNormal,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={tokens.semantic.icon.md}
        color={
          isCritical
            ? tokens.component.timer.textCritical
            : tokens.component.timer.textNormal
        }
      />
      <Text
        allowFontScaling
        maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
        style={[
          styles.timeText,
          {
            color: isCritical
              ? tokens.component.timer.textCritical
              : tokens.component.timer.textNormal,
          },
        ]}
      >
        {`${minutes}:${seconds}`}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: tokens.semantic.space.xxl,
    paddingHorizontal: tokens.semantic.space.lg,
    paddingVertical: tokens.semantic.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  timeText: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    fontWeight: tokens.semantic.font.title.weight,
    lineHeight: tokens.semantic.font.title.lineHeight,
  },
});
