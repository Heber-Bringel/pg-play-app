import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

export interface ExpressiveTimerProps {
  secondsRemaining: number;
}

export function ExpressiveTimer({ secondsRemaining }: ExpressiveTimerProps) {
  const isCritical = secondsRemaining <= 10;
  const formattedSeconds =
    secondsRemaining < 10 ? `0${secondsRemaining}` : `${secondsRemaining}`;

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={`Tempo restante: ${secondsRemaining} segundos`}
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
        },
      ]}
    >
      <MaterialCommunityIcons
        name={isCritical ? 'alert' : 'timer-outline'}
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
        00:{formattedSeconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
});
