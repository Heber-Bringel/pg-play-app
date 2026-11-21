import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type OptionStatus = 'default' | 'selected' | 'correct' | 'wrong';

export type QuizOptionProps = {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  status?: OptionStatus;
  disabled?: boolean;
  themeMode?: ThemeMode;
  onPress: () => void;
};

export const QuizOption = ({
  letter,
  text,
  status = 'default',
  disabled = false,
  themeMode,
  onPress,
}: QuizOptionProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const keyboardFocus = useKeyboardFocus();

  const getBackgroundColor = () => {
    if (status === 'correct') return activeTokens.component.quiz.option.correct.bg;
    if (status === 'wrong') return activeTokens.component.quiz.option.wrong.bg;
    if (status === 'selected') return activeTokens.semantic.color.actionContainer;
    return activeTokens.component.quiz.option.bg;
  };

  const getTextColor = () => {
    if (status === 'correct') return activeTokens.semantic.color.onSuccess;
    if (status === 'wrong') return activeTokens.semantic.color.onError;
    if (status === 'selected') return activeTokens.semantic.color.onActionContainer;
    return activeTokens.semantic.color.onSurface;
  };

  const statusLabel =
    status === 'correct'
      ? ', resposta correta'
      : status === 'wrong'
        ? ', resposta incorreta'
        : '';

  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
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
              ? activeTokens.component.quiz.option.border
              : status === 'selected'
                ? activeTokens.component.option.border.selected
                : getBackgroundColor(),
          borderRadius:
            status === 'wrong'
              ? activeTokens.semantic.radius.sm
              : status === 'correct'
                ? activeTokens.semantic.radius.md
                : activeTokens.component.quiz.option.radius,
        },
        focusRingStyle,
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
          size={activeTokens.semantic.icon.md}
          color={getTextColor()}
        />
      )}
      {status === 'wrong' && (
        <MaterialCommunityIcons
          name="close-circle"
          size={activeTokens.semantic.icon.md}
          color={getTextColor()}
        />
      )}
    </Pressable>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    container: {
      minHeight: activeTokens.component.quiz.option.minHeight,
      paddingHorizontal: activeTokens.semantic.space.md,
      paddingVertical: activeTokens.semantic.space.sm,
      borderWidth: activeTokens.semantic.border.thin,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: activeTokens.semantic.space.sm,
    },
    leftGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: activeTokens.semantic.space.sm,
    },
    letterBadge: {
      width: activeTokens.semantic.space.xl,
      height: activeTokens.semantic.space.xl,
      borderRadius: activeTokens.semantic.radius.full,
      backgroundColor: activeTokens.semantic.color.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    letterText: {
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
      color: activeTokens.semantic.color.onSurface,
    },
    optionText: {
      flex: 1,
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
    },
  });
