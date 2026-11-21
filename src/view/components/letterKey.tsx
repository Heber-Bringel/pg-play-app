import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import {
  getFocusRingStyle,
  useKeyboardFocus,
} from '@/view/components/useKeyboardFocus';
import { useTheme, type AppTokens, type ThemeMode } from '@/view/theme';

export type KeyStatus = 'available' | 'hit' | 'miss';

export type LetterKeyProps = {
  letter: string;
  status?: KeyStatus;
  themeMode?: ThemeMode;
  onPress: (letter: string) => void;
};

export const LetterKey = ({
  letter,
  status = 'available',
  themeMode,
  onPress,
}: LetterKeyProps) => {
  const activeTokens = useTheme(themeMode);
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  const keyboardFocus = useKeyboardFocus();
  const isUsed = status !== 'available';

  const getBackgroundColor = () => {
    if (status === 'hit') return activeTokens.component.key.hit.bg;
    if (status === 'miss') return activeTokens.component.key.miss.bg;
    return activeTokens.semantic.color.surfaceContainer;
  };

  const getTextColor = () => {
    if (status === 'hit') return activeTokens.semantic.color.onSuccess;
    if (status === 'miss') return activeTokens.semantic.color.onErrorContainer;
    return activeTokens.semantic.color.onSurface;
  };

  const statusDescription =
    status === 'hit'
      ? 'correta, já utilizada'
      : status === 'miss'
        ? 'incorreta, já utilizada'
        : 'disponível';

  const focusRingStyle = getFocusRingStyle(
    activeTokens,
    keyboardFocus.focusVisible
  );

  return (
    <Pressable
      onPress={() => onPress(letter)}
      disabled={isUsed}
      onPressIn={keyboardFocus.onPressIn}
      onPressOut={keyboardFocus.onPressOut}
      onFocus={keyboardFocus.onFocus}
      onBlur={keyboardFocus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={`Letra ${letter}, ${statusDescription}`}
      accessibilityState={{ disabled: isUsed }}
      style={[
        styles.key,
        {
          backgroundColor: getBackgroundColor(),
          borderColor:
            status === 'hit'
              ? activeTokens.component.option.border.success
              : status === 'miss'
                ? activeTokens.component.option.border.error
                : activeTokens.component.option.border.default,
          borderRadius:
            status === 'hit'
              ? activeTokens.semantic.radius.full
              : activeTokens.component.key.radius,
        },
        focusRingStyle,
      ]}
    >
      <Text
        allowFontScaling
        maxFontSizeMultiplier={activeTokens.semantic.typography.maxScale}
        style={[
          styles.letter,
          {
            color: getTextColor(),
            textDecorationLine: status === 'miss' ? 'line-through' : 'none',
          },
        ]}
      >
        {letter}
      </Text>
    </Pressable>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    key: {
      minWidth: activeTokens.component.key.size,
      minHeight: activeTokens.component.key.size,
      borderWidth: activeTokens.semantic.border.thin,
      justifyContent: 'center',
      alignItems: 'center',
    },
    letter: {
      fontFamily: activeTokens.semantic.font.label.family,
      fontSize: activeTokens.semantic.font.label.size,
      fontWeight: activeTokens.semantic.font.label.weight,
      lineHeight: activeTokens.semantic.font.label.lineHeight,
    },
  });
