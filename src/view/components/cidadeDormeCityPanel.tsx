import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CidadeDormePlayer } from '@/model/entities/multiplayerSession';
import { darkTokens, tokens, type ThemeMode } from '@/view/theme';

export type CidadeDormeCityPanelProgress = {
  label: string;
  current: number;
  total: number;
};

export type CidadeDormeCityPanelProps = {
  players: CidadeDormePlayer[];
  aliveCount: number;
  eliminatedCount: number;
  themeMode?: ThemeMode;
  reduceMotion?: boolean;
  progress?: CidadeDormeCityPanelProgress | null;
};

export function getAvatarInitials(nickname: string): string {
  const words = nickname.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return words[0].slice(0, 2).toUpperCase();
}

export const CidadeDormeCityPanel = ({
  players,
  aliveCount,
  eliminatedCount,
  themeMode = 'light',
  reduceMotion = false,
  progress = null,
}: CidadeDormeCityPanelProps) => {
  const activeTokens = themeMode === 'dark' ? darkTokens : tokens;
  const safeTotal = progress && progress.total > 0 ? progress.total : 1;
  const targetRatio = progress
    ? Math.min(1, Math.max(0, progress.current / safeTotal))
    : 0;

  const progressAnim = useRef(new Animated.Value(targetRatio)).current;

  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(targetRatio);
      return;
    }
    Animated.timing(progressAnim, {
      toValue: targetRatio,
      duration: activeTokens.semantic.motion.duration.medium,
      useNativeDriver: false,
    }).start();
  }, [
    activeTokens.semantic.motion.duration.medium,
    progressAnim,
    reduceMotion,
    targetRatio,
  ]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: activeTokens.component.card.bg,
          borderColor: activeTokens.semantic.color.outline,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.counterGroup}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={activeTokens.semantic.icon.sm}
            color={activeTokens.semantic.color.action}
          />
          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
            style={[
              styles.counterText,
              { color: activeTokens.semantic.color.onSurface },
            ]}
          >
            {`Vivos ${aliveCount} · Eliminados ${eliminatedCount}`}
          </Text>
        </View>
      </View>

      {progress && (
        <View
          style={styles.progressSection}
          accessibilityRole="progressbar"
          accessibilityLabel={`${progress.label} ${progress.current}/${progress.total}`}
        >
          <View style={styles.progressHeader}>
            <Text
              allowFontScaling
              style={[
                styles.progressLabel,
                { color: activeTokens.semantic.color.onSurfaceMuted },
              ]}
            >
              {`${progress.label} ${progress.current}/${progress.total}`}
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: activeTokens.semantic.color.surfaceVariant },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: activeTokens.semantic.color.action,
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.avatarGrid}>
        {players.map((player) => {
          const initial = getAvatarInitials(player.nickname);
          const isAlive = player.isAlive;

          return (
            <View
              key={player.id}
              style={[
                styles.playerChip,
                {
                  backgroundColor: isAlive
                    ? activeTokens.semantic.color.surface
                    : activeTokens.semantic.color.disabledBg,
                  borderColor: activeTokens.semantic.color.outline,
                },
              ]}
              accessibilityRole="text"
              accessibilityLabel={
                isAlive
                  ? `${player.nickname}: Vivo`
                  : `${player.nickname}: Eliminado`
              }
            >
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isAlive
                      ? activeTokens.semantic.color.actionContainer
                      : activeTokens.semantic.color.surfaceVariant,
                  },
                ]}
              >
                {isAlive ? (
                  <Text
                    allowFontScaling
                    style={[
                      styles.avatarInitial,
                      { color: activeTokens.semantic.color.onActionContainer },
                    ]}
                  >
                    {initial}
                  </Text>
                ) : (
                  <MaterialCommunityIcons
                    name="ghost-outline"
                    size={activeTokens.semantic.icon.sm}
                    color={activeTokens.semantic.color.disabledText}
                  />
                )}
              </View>

              <View style={styles.playerTextWrap}>
                <Text
                  allowFontScaling
                  numberOfLines={1}
                  style={[
                    styles.playerName,
                    {
                      color: isAlive
                        ? activeTokens.semantic.color.onSurface
                        : activeTokens.semantic.color.disabledText,
                    },
                  ]}
                >
                  {player.nickname}
                </Text>
                {!isAlive && (
                  <Text
                    allowFontScaling
                    style={[
                      styles.eliminatedLabel,
                      { color: activeTokens.semantic.color.disabledText },
                    ]}
                  >
                    Eliminado
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.semantic.radius.lg,
    padding: tokens.semantic.space.md,
    gap: tokens.semantic.space.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.xs,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  counterText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
  },
  progressSection: {
    gap: tokens.semantic.space.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
  },
  progressTrack: {
    height: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: tokens.semantic.space.sm,
    borderRadius: tokens.semantic.radius.full,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.semantic.space.sm,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
    borderWidth: tokens.semantic.border.thin,
    borderRadius: tokens.semantic.radius.md,
    paddingHorizontal: tokens.semantic.space.sm,
    paddingVertical: tokens.semantic.space.xs,
  },
  avatarCircle: {
    width: tokens.semantic.space.lg,
    height: tokens.semantic.space.lg,
    borderRadius: tokens.semantic.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
  },
  playerTextWrap: {
    gap: tokens.semantic.space.xs,
  },
  playerName: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
  },
  eliminatedLabel: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
  },
});
