import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GameCard } from '@/view/components/gameCard';

describe('GameCard (RNTL)', () => {
  it('renderiza título, tag e dispara onPress quando interativo', async () => {
    const onPress = jest.fn();
    await render(
      <GameCard
        title="Quiz Relâmpago"
        description="Perguntas rápidas em equipe"
        playersTag="2+ Equipes"
        icon="lightning-bolt"
        onPress={onPress}
      />,
    );

    expect(screen.getByText('Quiz Relâmpago')).toBeTruthy();
    expect(screen.getByText('2+ Equipes')).toBeTruthy();

    const card = screen.getByLabelText(
      'Quiz Relâmpago. 2+ Equipes. Perguntas rápidas em equipe',
    );
    expect(card.props.accessibilityState).toEqual({ disabled: false });

    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('bloqueia interação quando disabled é true', async () => {
    const onPress = jest.fn();
    await render(
      <GameCard
        title="Forca"
        description="Adivinhe a palavra"
        playersTag="2+ Equipes"
        icon="alphabetical"
        disabled
        onPress={onPress}
      />,
    );

    const card = screen.getByLabelText('Forca. 2+ Equipes. Adivinhe a palavra');
    expect(card.props.disabled).toBe(true);
    expect(card.props.accessibilityState).toEqual({ disabled: true });
  });
});
