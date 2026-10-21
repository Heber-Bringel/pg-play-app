import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

export type KeyStatus = 'available' | 'hit' | 'miss';

export interface LetterKeyProps {
  letter: string;
  status?: KeyStatus;
  onPress: (letter: string) => void;
}

export function LetterKey({
  letter,
  status = 'available',
  onPress,
}: LetterKeyProps) {
  const isUsed = status !== 'available';

  const getBackgroundColor = () => {
    if (status === 'hit') return tokens.component.key.hitBg;
    if (status === 'miss') return tokens.component.key.missBg;
    return tokens.semantic.color.surfaceContainer;
  };

  const getTextColor = () => {
    if (status === 'hit') return tokens.semantic.color.onSuccess;
    if (status === 'miss') return tokens.semantic.color.onErrorContainer;
    return tokens.semantic.color.onSurface;
  };

  const statusDescription =
    status === 'hit'
      ? 'correta, já utilizada'
      : status === 'miss'
      ? 'incorreta, já utilizada'
      : 'disponível';

  return (
    <Pressable
      onPress={() => onPress(letter)}
      disabled={isUsed}
      accessibilityRole="button"
      accessibilityLabel={`Letra ${letter}, ${statusDescription}`}
      accessibilityState={{ disabled: isUsed }}
      style={[
        styles.key,
        {
          backgroundColor: getBackgroundColor(),
          borderColor:
            status === 'hit'
              ? tokens.semantic.color.success
              : status === 'miss'
              ? tokens.semantic.color.error
              : tokens.semantic.color.outline,
          borderRadius:
            status === 'hit'
              ? tokens.semantic.radius.full
              : tokens.component.key.radius,
        },
      ]}
    >
      <Text
        allowFontScaling
        maxFontSizeMultiplier={tokens.semantic.typography.maxScale}
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
}

const styles = StyleSheet.create({
  key: {
    minWidth: tokens.component.key.size,
    minHeight: tokens.component.key.size,
    borderWidth: tokens.semantic.border.thin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontFamily: tokens.semantic.font.label.family,
    fontSize: tokens.semantic.font.label.size,
    fontWeight: tokens.semantic.font.label.weight,
  },
});
