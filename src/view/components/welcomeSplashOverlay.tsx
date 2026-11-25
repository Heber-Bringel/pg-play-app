import React, { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type WelcomeSplashOverlayProps = {
  visible: boolean;
  onFinish: () => void;
  themeMode?: ThemeMode;
};

export const WelcomeSplashOverlay = ({
  visible,
  onFinish,
  themeMode,
}: WelcomeSplashOverlayProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const isDark = activeTokens.mode === 'dark';

  const emblemScale = useRef(new Animated.Value(0.85)).current;
  const orbitOpacity = useRef(new Animated.Value(0)).current;
  const orbitScale = useRef(new Animated.Value(0.75)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then(
      (reduceMotion) => {
        if (cancelled) {
          return;
        }
        if (reduceMotion) {
          onFinish();
          return;
        }

        Animated.spring(emblemScale, {
          toValue: 1,
          damping: activeTokens.semantic.motion.spring.spatial.damping,
          stiffness: activeTokens.semantic.motion.spring.spatial.stiffness,
          useNativeDriver: true,
        }).start();

        Animated.timing(orbitOpacity, {
          toValue: 1,
          delay: activeTokens.component.splash.orbitDelay,
          duration: activeTokens.semantic.motion.duration.medium,
          useNativeDriver: true,
        }).start();

        Animated.timing(orbitScale, {
          toValue: 1,
          delay: activeTokens.component.splash.orbitDelay,
          duration: activeTokens.semantic.motion.duration.medium,
          useNativeDriver: true,
        }).start();

        Animated.timing(subtitleOpacity, {
          toValue: 1,
          delay: activeTokens.component.splash.subtitleDelay,
          duration: activeTokens.semantic.motion.duration.medium,
          useNativeDriver: true,
        }).start();

        fadeTimer = setTimeout(() => {
          if (!cancelled) {
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: activeTokens.semantic.motion.duration.medium,
              useNativeDriver: true,
            }).start();
          }
        }, activeTokens.component.splash.fadeOutStart);

        finishTimer = setTimeout(() => {
          if (!cancelled) {
            onFinish();
          }
        }, activeTokens.component.splash.displayDuration);
      },
      () => {
        if (!cancelled) {
          onFinish();
        }
      }
    );

    return () => {
      cancelled = true;
      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
      if (finishTimer) {
        clearTimeout(finishTimer);
      }
    };
  }, [
    activeTokens.component.splash.displayDuration,
    activeTokens.component.splash.fadeOutStart,
    activeTokens.component.splash.orbitDelay,
    activeTokens.component.splash.subtitleDelay,
    activeTokens.semantic.motion.duration.medium,
    activeTokens.semantic.motion.spring.spatial.damping,
    activeTokens.semantic.motion.spring.spatial.stiffness,
    emblemScale,
    onFinish,
    orbitOpacity,
    orbitScale,
    overlayOpacity,
    subtitleOpacity,
    visible,
  ]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Abrindo PG PLAY, Minigames para Pequenos Grupos"
    >
      <View pointerEvents="none" style={styles.ambientShapeTop} />
      <View pointerEvents="none" style={styles.ambientShapeBottom} />

      <View style={styles.topSpacer} />

      <View style={styles.centerStage}>
        <View style={styles.orbitStage}>
          {isDark && <View pointerEvents="none" style={styles.emblemHalo} />}

          <Animated.View
            style={[
              styles.orbitalTrophy,
              {
                opacity: orbitOpacity,
                transform: [{ scale: orbitScale }, { rotate: '-10deg' }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy"
              size={activeTokens.semantic.icon.md}
              color={activeTokens.semantic.color.onHighlight}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.orbitalGroup,
              {
                opacity: orbitOpacity,
                transform: [{ scale: orbitScale }, { rotate: '8deg' }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={activeTokens.semantic.icon.md}
              color={activeTokens.semantic.color.onSecondary}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.orbitalSparkle,
              {
                opacity: orbitOpacity,
                transform: [{ scale: orbitScale }, { rotate: '-6deg' }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="star-four-points"
              size={activeTokens.semantic.icon.sm}
              color={activeTokens.component.splash.orbitalSparkleIcon}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.emblemCard,
              {
                transform: [{ scale: emblemScale }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="gamepad-variant"
              size={activeTokens.component.splash.emblemIconSize}
              color={activeTokens.component.splash.emblemIcon}
            />
          </Animated.View>
        </View>

        <Animated.Text
          allowFontScaling
          style={[
            styles.title,
            {
              opacity: orbitOpacity,
            },
          ]}
        >
          PG PLAY
        </Animated.Text>

        <Animated.Text
          allowFontScaling
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
            },
          ]}
        >
          Minigames para Pequenos Grupos
        </Animated.Text>
      </View>

      <Animated.View style={[styles.dotsRow, { opacity: subtitleOpacity }]}>
        <View style={styles.dotActive} />
        <View style={styles.dotInactive} />
        <View style={styles.dotInactive} />
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space, border, elevation } =
    activeTokens.semantic;
  const { splash } = activeTokens.component;
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      overflow: 'hidden',
      backgroundColor: splash.bg,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.lg,
      paddingVertical: space['2xl'],
    },
    ambientShapeTop: {
      position: 'absolute',
      top: splash.ambientTopOffsetY,
      right: splash.ambientTopOffsetX,
      width: splash.ambientTopSize,
      height: splash.ambientTopSize,
      borderRadius: splash.ambientTopRadius,
      backgroundColor: splash.accentShapeTop,
      transform: [{ rotate: '18deg' }],
    },
    ambientShapeBottom: {
      position: 'absolute',
      bottom: splash.ambientBottomOffsetY,
      left: splash.ambientBottomOffsetX,
      width: splash.ambientBottomSize,
      height: splash.ambientBottomSize,
      borderRadius: splash.ambientBottomRadius,
      backgroundColor: splash.accentShapeBottom,
    },
    topSpacer: {
      height: space.md,
    },
    centerStage: {
      alignItems: 'center',
      gap: space.sm,
    },
    orbitStage: {
      width: splash.stageWidth,
      height: splash.stageHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emblemHalo: {
      position: 'absolute',
      width: splash.haloSize,
      height: splash.haloSize,
      borderRadius: radius.full,
      backgroundColor: color.actionContainer,
    },
    emblemCard: {
      width: splash.emblemSize,
      height: splash.emblemSize,
      borderRadius: splash.emblemRadius,
      backgroundColor: splash.emblemBg,
      borderWidth: border.thin,
      borderColor: splash.emblemBorder,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: elevation.floating,
    },
    orbitalTrophy: {
      position: 'absolute',
      top: splash.orbitalTrophyTop,
      left: splash.orbitalTrophyLeft,
      width: splash.orbitalLarge,
      height: splash.orbitalLarge,
      borderRadius: splash.orbitalRadiusLarge,
      backgroundColor: color.highlight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orbitalGroup: {
      position: 'absolute',
      top: splash.orbitalGroupTop,
      right: splash.orbitalGroupRight,
      width: splash.orbitalMedium,
      height: splash.orbitalMedium,
      borderRadius: radius.full,
      backgroundColor: color.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orbitalSparkle: {
      position: 'absolute',
      bottom: splash.orbitalSparkleBottom,
      right: splash.orbitalSparkleRight,
      width: splash.orbitalSmall,
      height: splash.orbitalSmall,
      borderRadius: splash.orbitalRadiusSmall,
      backgroundColor: splash.orbitalSparkleBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: font.display.family,
      fontSize: splash.titleSize,
      fontWeight: font.display.weight,
      lineHeight: splash.titleLineHeight,
      color: splash.titleColor,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: font.subtitle.family,
      fontSize: font.body.size,
      fontWeight: font.subtitle.weight,
      lineHeight: font.body.lineHeight,
      color: splash.subtitleColor,
      textAlign: 'center',
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
    },
    dotActive: {
      width: splash.dotActiveWidth,
      height: splash.dotSize,
      borderRadius: radius.full,
      backgroundColor: splash.dotActive,
    },
    dotInactive: {
      width: splash.dotSize,
      height: splash.dotSize,
      borderRadius: radius.full,
      backgroundColor: splash.dotInactive,
    },
  });
};
