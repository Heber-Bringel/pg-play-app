import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Team } from '@/model/entities/team';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type EncounterPodiumProps = {
  teams: Team[];
  totalPoints: number;
  onOpenScoreboard: () => void;
  onRequestReset: () => void;
  themeMode?: ThemeMode;
};

type PodiumSlot = {
  rank: 1 | 2 | 3;
  team: Team;
};

export const EncounterPodium = ({
  teams,
  totalPoints,
  onOpenScoreboard,
  onRequestReset,
  themeMode,
}: EncounterPodiumProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const scoreboardFocus = useKeyboardFocus();
  const resetFocus = useKeyboardFocus();

  const scoreboardFocusRing = getFocusRingStyle(
    activeTokens,
    scoreboardFocus.focusVisible
  );
  const resetFocusRing = getFocusRingStyle(
    activeTokens,
    resetFocus.focusVisible
  );
  const resetDisabled = totalPoints === 0;

  const topThree = teams.slice(0, 3);
  const slots: PodiumSlot[] = [];

  if (topThree.length >= 2) {
    slots.push({ rank: 2, team: topThree[1] });
  }
  if (topThree.length >= 1) {
    slots.push({ rank: 1, team: topThree[0] });
  }
  if (topThree.length >= 3) {
    slots.push({ rank: 3, team: topThree[2] });
  }

  return (
    <View style={styles.container}>
      <Text allowFontScaling style={styles.heading}>
        Pódio do Encontro
      </Text>

      <View
        style={styles.podiumRow}
        accessible
        accessibilityLabel={`Pódio do Encontro com ${topThree.length} equipes`}
      >
        {slots.map(({ rank, team }) => {
          const isFirst = rank === 1;
          const isSecond = rank === 2;
          const columnStyle = isFirst
            ? styles.firstColumn
            : isSecond
              ? styles.secondColumn
              : styles.thirdColumn;
          const badgeStyle = isFirst
            ? styles.firstBadge
            : isSecond
              ? styles.secondBadge
              : styles.thirdBadge;
          const badgeTextStyle = isFirst
            ? styles.firstBadgeText
            : isSecond
              ? styles.secondBadgeText
              : styles.thirdBadgeText;
          const nameColorStyle = isFirst
            ? styles.firstText
            : isSecond
              ? styles.secondText
              : styles.thirdText;
          const nameSizeStyle = isFirst
            ? styles.firstTeamName
            : styles.otherTeamName;

          return (
            <View
              key={team.id}
              style={[styles.columnBase, columnStyle]}
              accessible
              accessibilityLabel={`${rank}º lugar: ${team.name}, ${team.score} pontos`}
            >
              <View style={[styles.rankCircleBase, badgeStyle]}>
                <Text allowFontScaling style={badgeTextStyle}>
                  {`${rank}º`}
                </Text>
              </View>

              <Text
                allowFontScaling
                numberOfLines={2}
                style={[nameSizeStyle, nameColorStyle]}
              >
                {team.name}
              </Text>

              {isFirst ? (
                <View style={styles.firstScorePill}>
                  <Text allowFontScaling style={styles.firstScorePillText}>
                    {`${team.score} pts`}
                  </Text>
                </View>
              ) : (
                <Text allowFontScaling style={[styles.scoreText, nameColorStyle]}>
                  {`${team.score} pts`}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.quickStrip}>
        <Pressable
          onPress={onOpenScoreboard}
          onPressIn={scoreboardFocus.onPressIn}
          onPressOut={scoreboardFocus.onPressOut}
          onFocus={scoreboardFocus.onFocus}
          onBlur={scoreboardFocus.onBlur}
          accessibilityRole="button"
          accessibilityLabel="Ver placar completo"
          style={[styles.quickActionBtn, scoreboardFocusRing]}
        >
          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
            style={styles.quickActionPrimary}
          >
            Ver placar completo
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={activeTokens.semantic.icon.sm}
            color={activeTokens.semantic.color.action}
          />
        </Pressable>

        <Pressable
          onPress={onRequestReset}
          disabled={resetDisabled}
          onPressIn={resetFocus.onPressIn}
          onPressOut={resetFocus.onPressOut}
          onFocus={resetFocus.onFocus}
          onBlur={resetFocus.onBlur}
          accessibilityRole="button"
          accessibilityLabel="Zerar"
          accessibilityState={{ disabled: resetDisabled }}
          style={[styles.quickActionBtn, resetFocusRing]}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={activeTokens.semantic.icon.sm}
            color={
              resetDisabled
                ? activeTokens.semantic.color.disabledText
                : activeTokens.semantic.color.onSurfaceMuted
            }
          />
          <Text
            allowFontScaling
            maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
            style={[
              styles.quickActionMuted,
              resetDisabled ? styles.quickActionDisabled : null,
            ]}
          >
            Zerar
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) => {
  const { color, font, radius, space } = activeTokens.semantic;
  const { podium } = activeTokens.component;
  return StyleSheet.create({
    container: {
      gap: space.md,
      alignItems: 'center',
    },
    heading: {
      fontFamily: font.title.family,
      fontSize: font.title.size,
      fontWeight: font.title.weight,
      lineHeight: font.title.lineHeight,
      color: color.onSurface,
      textAlign: 'center',
    },
    podiumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: space.sm,
      width: '100%',
    },
    columnBase: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.sm,
      paddingVertical: space.md,
      gap: space.sm,
    },
    firstColumn: {
      minHeight: podium.firstMinHeight,
      backgroundColor: podium.firstBg,
      borderRadius: podium.radiusFirst,
    },
    secondColumn: {
      minHeight: podium.secondMinHeight,
      backgroundColor: podium.secondBg,
      borderRadius: podium.radiusOther,
    },
    thirdColumn: {
      minHeight: podium.thirdMinHeight,
      backgroundColor: podium.thirdBg,
      borderRadius: podium.radiusOther,
    },
    rankCircleBase: {
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    firstBadge: {
      width: podium.firstBadgeSize,
      height: podium.firstBadgeSize,
      backgroundColor: podium.firstBadgeBg,
    },
    secondBadge: {
      width: podium.badgeSize,
      height: podium.badgeSize,
      backgroundColor: podium.secondBadgeBg,
    },
    thirdBadge: {
      width: podium.badgeSize,
      height: podium.badgeSize,
      backgroundColor: podium.thirdBadgeBg,
    },
    firstBadgeText: {
      fontFamily: font.label.family,
      fontSize: font.label.size,
      fontWeight: font.label.weight,
      lineHeight: font.label.lineHeight,
      color: podium.firstBadgeText,
    },
    secondBadgeText: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: podium.secondBadgeText,
    },
    thirdBadgeText: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: podium.thirdBadgeText,
    },
    firstTeamName: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      textAlign: 'center',
    },
    otherTeamName: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      textAlign: 'center',
    },
    firstText: {
      color: podium.firstText,
    },
    secondText: {
      color: podium.secondText,
    },
    thirdText: {
      color: podium.thirdText,
    },
    firstScorePill: {
      backgroundColor: podium.firstBadgeBg,
      borderRadius: radius.full,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
    },
    firstScorePillText: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: podium.firstBadgeText,
    },
    scoreText: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      textAlign: 'center',
    },
    quickStrip: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: color.surfaceVariant,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: 0,
      gap: space.sm,
    },
    quickActionBtn: {
      minHeight: space['2xl'],
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      paddingHorizontal: space.xs,
      borderRadius: radius.sm,
    },
    quickActionPrimary: {
      fontFamily: font.tag.family,
      fontSize: font.tag.size,
      fontWeight: font.tag.weight,
      lineHeight: font.tag.lineHeight,
      color: color.action,
    },
    quickActionMuted: {
      fontFamily: font.caption.family,
      fontSize: font.caption.size,
      fontWeight: font.caption.weight,
      lineHeight: font.caption.lineHeight,
      color: color.onSurfaceMuted,
    },
    quickActionDisabled: {
      color: color.disabledText,
    },
  });
};
