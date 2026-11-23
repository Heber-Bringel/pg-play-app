import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTokens, tokens, type ThemeMode } from '@/view/theme';

export type TimelineStepItem = {
  id: 'night' | 'dawn' | 'debate' | 'voting';
  label: string;
  isActive: boolean;
  isCompleted: boolean;
};

export type CidadeDormePhaseTimelineProps = {
  steps: TimelineStepItem[];
  currentRound: number;
  isNightPhase: boolean;
  themeMode?: ThemeMode;
};

const STEP_ICONS: Record<
  TimelineStepItem['id'],
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  night: 'weather-night',
  dawn: 'weather-sunny',
  debate: 'forum-outline',
  voting: 'vote-outline',
};

export const CidadeDormePhaseTimeline = ({
  steps,
  currentRound,
  isNightPhase,
  themeMode = 'light',
}: CidadeDormePhaseTimelineProps) => {
  const activeTokens = themeMode === 'dark' ? darkTokens : tokens;
  const cycleLabel = isNightPhase
    ? `Noite ${currentRound}`
    : `Dia ${currentRound}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: activeTokens.component.card.bg,
          borderColor: activeTokens.semantic.color.outline,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Linha do tempo da partida, ${cycleLabel}`}
    >
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name={isNightPhase ? 'weather-night' : 'weather-sunny'}
          size={activeTokens.semantic.icon.sm}
          color={activeTokens.semantic.color.action}
        />
        <Text
          allowFontScaling
          maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
          style={[
            styles.cycleTitle,
            { color: activeTokens.semantic.color.onSurface },
          ]}
        >
          {cycleLabel}
        </Text>
      </View>

      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const iconName = step.isCompleted
            ? 'check-circle'
            : STEP_ICONS[step.id];

          const pillBg = step.isActive
            ? activeTokens.semantic.color.actionContainer
            : step.isCompleted
            ? activeTokens.semantic.color.surfaceVariant
            : activeTokens.semantic.color.surface;

          const pillBorder = step.isActive
            ? activeTokens.semantic.color.action
            : activeTokens.semantic.color.outline;

          const pillRadius = step.isActive
            ? activeTokens.semantic.radius.md
            : activeTokens.semantic.radius.full;

          const textColor = step.isActive
            ? activeTokens.semantic.color.onActionContainer
            : step.isCompleted
            ? activeTokens.semantic.color.onSurface
            : activeTokens.semantic.color.onSurfaceMuted;

          const iconColor = step.isActive
            ? activeTokens.semantic.color.action
            : step.isCompleted
            ? activeTokens.semantic.color.success
            : activeTokens.semantic.color.onSurfaceMuted;

          const statusLabel = step.isActive
            ? 'etapa atual'
            : step.isCompleted
            ? 'concluída'
            : 'aguardando';

          return (
            <React.Fragment key={step.id}>
              <View
                style={[
                  styles.stepPill,
                  {
                    backgroundColor: pillBg,
                    borderColor: pillBorder,
                    borderRadius: pillRadius,
                  },
                ]}
                accessibilityRole="text"
                accessibilityLabel={`${step.label}: ${statusLabel}`}
                accessibilityState={{ selected: step.isActive }}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={activeTokens.semantic.icon.sm}
                  color={iconColor}
                />
                <Text
                  allowFontScaling
                  maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
                  style={[styles.stepText, { color: textColor }]}
                >
                  {step.label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={activeTokens.semantic.icon.sm}
                  color={activeTokens.semantic.color.onSurfaceMuted}
                />
              )}
            </React.Fragment>
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
    gap: tokens.semantic.space.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  cycleTitle: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    lineHeight: tokens.semantic.font.label.lineHeight,
    fontWeight: tokens.semantic.font.label.weight,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
    borderWidth: tokens.semantic.border.thin,
    paddingHorizontal: tokens.semantic.space.sm,
    paddingVertical: tokens.semantic.space.xs,
  },
  stepText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    lineHeight: tokens.semantic.font.caption.lineHeight,
    fontWeight: tokens.semantic.font.caption.weight,
  },
});
