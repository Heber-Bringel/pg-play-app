import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

export type OptionStatus = 'default' | 'selected' | 'correct' | 'wrong';

export interface QuizOptionProps {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  status?: OptionStatus;
  disabled?: boolean;
  onPress: () => void;
}

export function QuizOption({
  letter,
  text,
  status = 'default',
  disabled = false,
  onPress,
}: QuizOptionProps) {
  const getBackgroundColor = () => {
    if (status === 'correct') return tokens.component.quiz.optionCorrectBg;
    if (status === 'wrong') return tokens.component.quiz.optionWrongBg;
    if (status === 'selected') return tokens.semantic.color.actionContainer;
    return tokens.component.quiz.optionBg;
  };

  const getTextColor = () => {
    if (status === 'correct') return tokens.semantic.color.onSuccess;
    if (status === 'wrong') return tokens.semantic.color.onError;
    if (status === 'selected') return tokens.semantic.color.onActionContainer;
    return tokens.semantic.color.onSurface;
  };

  const statusLabel =
    status === 'correct'
      ? ', resposta correta'
      : status === 'wrong'
      ? ', resposta incorreta'
      : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Alternativa ${letter}: ${text}${statusLabel}`}
      accessibilityState={{
        disabled,
        selected: status !== 'default',
      }}
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor:
            status === 'default'
              ? tokens.component.quiz.optionBorder
              : getBackgroundColor(),
          borderRadius:
            status === 'wrong'
              ? tokens.semantic.radius.sm
              : tokens.component.quiz.optionRadius,
        },
      ]}
    >
      <View style={styles.leftGroup}>
        <View style={styles.letterBadge}>
          <Text allowFontScaling style={styles.letterText}>
            {letter}
          </Text>
        </View>
        <Text
          allowFontScaling
          style={[styles.optionText, { color: getTextColor() }]}
        >
          {text}
        </Text>
      </View>

      {status === 'correct' && (
        <MaterialCommunityIcons
          name="check-circle"
          size={tokens.semantic.icon.md}
          color={getTextColor()}
        />
      )}
      {status === 'wrong' && (
        <MaterialCommunityIcons
          name="close-circle"
          size={tokens.semantic.icon.md}
          color={getTextColor()}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: tokens.primitive.space.space56,
    paddingHorizontal: tokens.semantic.space.md,
    paddingVertical: tokens.semantic.space.sm,
    borderWidth: tokens.semantic.border.thin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.semantic.space.sm,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  letterBadge: {
    width: tokens.semantic.space.xl,
    height: tokens.semantic.space.xl,
    borderRadius: tokens.semantic.radius.full,
    backgroundColor: tokens.semantic.color.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letterText: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
    color: tokens.semantic.color.onSurface,
  },
  optionText: {
    flex: 1,
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
  },
});
