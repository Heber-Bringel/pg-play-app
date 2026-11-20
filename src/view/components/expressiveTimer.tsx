import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '@/view/theme';

export type ExpressiveTimerVariant = 'countdown' | 'thermometer';

export type ExpressiveTimerProps = {
  secondsRemaining: number;
  variant?: ExpressiveTimerVariant;
  totalSeconds?: number;
  paused?: boolean;
};

export const ExpressiveTimer = ({
  secondsRemaining,
  variant = 'countdown',
  totalSeconds = 60,
  paused = false,
}: ExpressiveTimerProps) => {
  const safeSeconds = Math.max(0, Math.floor(secondsRemaining));
  const safeTotal = Math.max(1, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isCritical = variant === 'countdown' && safeSeconds <= 10;
  const isExpired = safeSeconds === 0;

  useEffect(() => {
    if (variant === 'countdown' && isCritical && !isExpired && !paused) {
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
  }, [variant, safeSeconds, isCritical, isExpired, paused, scaleAnim]);

  if (variant === 'thermometer') {
    const elapsed = Math.max(0, safeTotal - safeSeconds);
    const ratio = Math.min(1, Math.max(0, elapsed / safeTotal));
    const fillPercent = Math.round(ratio * 100);
    const isWarm = ratio >= 0.7 && !isExpired;

    const fillBg = paused
      ? tokens.semantic.color.surfaceVariant
      : isExpired || isWarm
      ? tokens.semantic.color.highlight
      : tokens.semantic.color.actionContainer;

    const badgeBg = paused
      ? tokens.semantic.color.surfaceVariant
      : isExpired || isWarm
      ? tokens.semantic.color.highlight
      : tokens.semantic.color.actionContainer;

    const badgeText = paused
      ? tokens.semantic.color.onSurfaceMuted
      : isExpired || isWarm
      ? tokens.semantic.color.onHighlight
      : tokens.semantic.color.onActionContainer;

    const statusLabel = paused
      ? 'Pausado'
      : isExpired
      ? 'Tempo concluído'
      : isWarm
      ? 'Pode ir concluindo'
      : 'Tempo tranquilo';

    const thermoIcon = paused
      ? 'pause-circle-outline'
      : isExpired
      ? 'heart'
      : isWarm
      ? 'thermometer-high'
      : 'thermometer-low';

    const shouldAnnounce =
      isExpired || safeSeconds === 30 || (isWarm && elapsed === Math.ceil(safeTotal * 0.7));

    const a11yLabel = isExpired
      ? 'Tempo concluído'
      : safeSeconds === 30
      ? '30 segundos restantes'
      : `${statusLabel}. Tempo restante: ${minutes}:${seconds}`;

    return (
      <View
        accessibilityRole="timer"
        accessibilityLabel={a11yLabel}
        accessibilityLiveRegion={shouldAnnounce ? 'polite' : 'none'}
        style={styles.thermometerCard}
      >
        <View style={styles.thermometerHeader}>
          <View
            style={[
              styles.thermometerBadge,
              {
                backgroundColor: badgeBg,
                borderRadius: isExpired
                  ? tokens.semantic.radius.md
                  : tokens.semantic.radius.full,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={thermoIcon}
              size={tokens.semantic.icon.md}
              color={badgeText}
            />
            <Text
              allowFontScaling
              maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
              style={[styles.thermometerStatusText, { color: badgeText }]}
            >
              {statusLabel}
            </Text>
          </View>

          <Text
            allowFontScaling
            maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
            style={styles.thermometerClockText}
          >
            {`${minutes}:${seconds}`}
          </Text>
        </View>

        <View style={styles.thermometerTrack}>
          <View
            style={[
              styles.thermometerFill,
              {
                width: `${fillPercent}%`,
                backgroundColor: fillBg,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  const iconName = isExpired ? 'bell-ring' : isCritical ? 'alert' : 'timer-outline';

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
  thermometerCard: {
    width: '100%',
    backgroundColor: tokens.semantic.color.surfaceContainer,
    borderColor: tokens.semantic.color.outline,
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.semantic.radius.xl,
    padding: tokens.semantic.space.md,
    gap: tokens.semantic.space.md,
  },
  thermometerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.sm,
  },
  thermometerBadge: {
    minHeight: tokens.semantic.space.xxl,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  thermometerStatusText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    lineHeight: tokens.semantic.font.label.lineHeight,
  },
  thermometerClockText: {
    fontFamily: tokens.semantic.font.title.family,
    fontSize: tokens.semantic.font.title.size,
    fontWeight: tokens.semantic.font.title.weight,
    lineHeight: tokens.semantic.font.title.lineHeight,
    color: tokens.semantic.color.onSurface,
  },
  thermometerTrack: {
    width: '100%',
    height: tokens.semantic.space.lg,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
    overflow: 'hidden',
  },
  thermometerFill: {
    height: '100%',
    borderRadius: tokens.semantic.radius.full,
  },
});
