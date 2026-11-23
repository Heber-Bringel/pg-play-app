import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExpressiveButton } from '@/view/components/expressiveButton';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type ExpressiveTimerVariant = 'countdown' | 'thermometer';

export type ExpressiveTimerProps = {
  secondsRemaining: number;
  variant?: ExpressiveTimerVariant;
  totalSeconds?: number;
  paused?: boolean;
  onTogglePause?: () => void;
  reduceMotion?: boolean;
  themeMode?: ThemeMode;
};

export const ExpressiveTimer = ({
  secondsRemaining,
  variant = 'countdown',
  totalSeconds = 60,
  paused = false,
  onTogglePause,
  reduceMotion = false,
  themeMode,
}: ExpressiveTimerProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  const safeSeconds = Math.max(0, Math.floor(secondsRemaining));
  const safeTotal = Math.max(1, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isCritical = variant === 'countdown' && safeSeconds <= 10;
  const isExpired = safeSeconds === 0;

  useEffect(() => {
    if (
      variant === 'countdown' &&
      isCritical &&
      !isExpired &&
      !paused &&
      !reduceMotion
    ) {
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
    variant,
    safeSeconds,
    isCritical,
    isExpired,
    paused,
    reduceMotion,
    scaleAnim,
    activeTokens.semantic.motion.spring.spatial.damping,
    activeTokens.semantic.motion.spring.spatial.stiffness,
  ]);

  if (variant === 'thermometer') {
    const elapsed = Math.max(0, safeTotal - safeSeconds);
    const ratio = Math.min(1, Math.max(0, elapsed / safeTotal));
    const fillPercent = Math.round(ratio * 100);
    const isWarm = ratio >= 0.7 && !isExpired;

    // Issue #50 e #72: alto contraste (>= 3:1) sobre surfaceVariant em todas as fases (tranquilo, quente/concluído e pausado), no tema claro e no escuro
    const fillBg = paused
      ? activeTokens.semantic.color.outline
      : isExpired || isWarm
        ? activeTokens.semantic.color.highlightBorder
        : activeTokens.component.timer.bg.calm;

    const bulbBorderColor = paused
      ? activeTokens.semantic.color.outline
      : isExpired || isWarm
        ? activeTokens.semantic.color.highlightBorder
        : activeTokens.semantic.color.action;

    const bulbIconColor = paused
      ? activeTokens.semantic.color.surfaceContainer
      : isExpired || isWarm
        ? activeTokens.mode === 'dark'
          ? activeTokens.semantic.color.onHighlight
          : activeTokens.semantic.color.surfaceContainer
        : activeTokens.semantic.color.onAction;

    const badgeBg = paused
      ? activeTokens.semantic.color.surfaceVariant
      : isExpired || isWarm
        ? activeTokens.semantic.color.highlightContainer
        : activeTokens.semantic.color.actionContainer;

    const badgeBorder = paused
      ? activeTokens.semantic.color.outline
      : isExpired || isWarm
        ? activeTokens.semantic.color.highlightBorder
        : activeTokens.semantic.color.action;

    const badgeText = paused
      ? activeTokens.semantic.color.onSurface
      : isExpired || isWarm
        ? activeTokens.semantic.color.onHighlightContainer
        : activeTokens.semantic.color.onActionContainer;

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
      isExpired ||
      safeSeconds === 30 ||
      (isWarm && elapsed === Math.ceil(safeTotal * 0.7));

    const a11yLabel = isExpired
      ? 'Tempo concluído'
      : safeSeconds === 30
        ? '30 segundos restantes'
        : `${statusLabel}. Tempo restante: ${minutes}:${seconds}. Preenchimento: ${fillPercent}%`;

    return (
      <View
        accessibilityRole="timer"
        accessibilityLabel={a11yLabel}
        accessibilityLiveRegion={shouldAnnounce ? 'polite' : 'none'}
        style={styles.thermometerCard}
      >
        <View style={styles.thermometerBody}>
          <View style={styles.thermometerColumn}>
            <View style={styles.thermometerTube}>
              <View
                style={[
                  styles.thermometerMercury,
                  {
                    height: `${fillPercent}%`,
                    backgroundColor: fillBg,
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.thermometerBulb,
                {
                  backgroundColor: fillBg,
                  borderColor: bulbBorderColor,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={thermoIcon}
                size={activeTokens.semantic.icon.sm}
                color={bulbIconColor}
              />
            </View>
          </View>

          <View style={styles.thermometerInfo}>
            <View style={styles.thermometerHeader}>
              <View
                style={[
                  styles.thermometerBadge,
                  {
                    backgroundColor: badgeBg,
                    borderColor: badgeBorder,
                    borderRadius: isExpired
                      ? activeTokens.semantic.radius.md
                      : activeTokens.semantic.radius.full,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={thermoIcon}
                  size={activeTokens.semantic.icon.md}
                  color={badgeText}
                />
                <Text
                  allowFontScaling
                  maxFontSizeMultiplier={
                    activeTokens.semantic.typography.maxScale
                  }
                  style={[styles.thermometerStatusText, { color: badgeText }]}
                >
                  {statusLabel}
                </Text>
              </View>

              {onTogglePause && !isExpired && (
                <ExpressiveButton
                  variant="icon"
                  icon={paused ? 'play' : 'pause'}
                  accessibilityLabel={paused ? 'Continuar' : 'Pausar'}
                  themeMode={themeMode}
                  onPress={onTogglePause}
                />
              )}
            </View>

            <Text
              allowFontScaling
              maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
              style={styles.thermometerClockText}
            >
              {`${minutes}:${seconds}`}
            </Text>

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
        </View>
      </View>
    );
  }

  const iconName = isExpired
    ? 'bell-ring'
    : isCritical
      ? 'alert'
      : 'timer-outline';

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
    thermometerCard: {
      width: '100%',
      backgroundColor: activeTokens.component.card.bg,
      borderColor: activeTokens.component.card.border,
      borderWidth: activeTokens.semantic.border.thin,
      borderRadius: activeTokens.component.card.radius,
      padding: activeTokens.semantic.space.md,
    },
    thermometerBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.md,
    },
    thermometerColumn: {
      alignItems: 'center',
    },
    thermometerTube: {
      width: activeTokens.semantic.space.lg,
      height: activeTokens.semantic.space['3xl'] + activeTokens.semantic.space.xl,
      borderRadius: activeTokens.semantic.radius.full,
      borderWidth: activeTokens.semantic.border.thin,
      borderColor: activeTokens.semantic.color.outline,
      backgroundColor: activeTokens.semantic.color.surfaceVariant,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    thermometerMercury: {
      width: '100%',
      borderRadius: activeTokens.semantic.radius.full,
    },
    thermometerBulb: {
      width: activeTokens.semantic.space.xl,
      height: activeTokens.semantic.space.xl,
      borderRadius: activeTokens.semantic.radius.full,
      borderWidth: activeTokens.semantic.border.thin,
      marginTop: -activeTokens.semantic.space.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thermometerInfo: {
      flex: 1,
      gap: activeTokens.semantic.space.sm,
    },
    thermometerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: activeTokens.semantic.space.sm,
    },
    thermometerBadge: {
      minHeight: activeTokens.semantic.space['2xl'],
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingVertical: activeTokens.semantic.space.xs,
      borderWidth: activeTokens.semantic.border.thin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.xs,
    },
    thermometerStatusText: {
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
    },
    thermometerClockText: {
      fontFamily: activeTokens.semantic.font.display.family,
      fontSize: activeTokens.semantic.font.display.size,
      fontWeight: activeTokens.semantic.font.display.weight,
      lineHeight: activeTokens.semantic.font.display.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    thermometerTrack: {
      width: '100%',
      height: activeTokens.semantic.space.md,
      borderRadius: activeTokens.semantic.radius.full,
      borderWidth: activeTokens.semantic.border.thin,
      borderColor: activeTokens.semantic.color.outline,
      backgroundColor: activeTokens.semantic.color.surfaceVariant,
      overflow: 'hidden',
    },
    thermometerFill: {
      height: '100%',
      borderRadius: activeTokens.semantic.radius.full,
    },
  });
