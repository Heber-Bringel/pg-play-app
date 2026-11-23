import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LetterKey } from '@/view/components/letterKey';

describe('LetterKey (RNTL)', () => {
  it('dispara onPress com a letra quando disponível', async () => {
    const onPress = jest.fn();
    await render(<LetterKey letter="A" status="available" onPress={onPress} />);

    const key = screen.getByLabelText('Letra A, disponível');
    expect(key.props.accessibilityRole).toBe('button');
    expect(key.props.accessibilityState).toEqual({ disabled: false });

    await fireEvent.press(key);
    expect(onPress).toHaveBeenCalledWith('A');
  });

  it('desabilita tecla quando status é hit ou miss', async () => {
    const onPress = jest.fn();
    await render(<LetterKey letter="E" status="hit" onPress={onPress} />);

    const hitKey = screen.getByLabelText('Letra E, correta, já utilizada');
    expect(hitKey.props.disabled).toBe(true);
    expect(hitKey.props.accessibilityState).toEqual({ disabled: true });

    await render(<LetterKey letter="Z" status="miss" onPress={onPress} />);
    const missKey = screen.getByLabelText('Letra Z, incorreta, já utilizada');
    expect(missKey.props.disabled).toBe(true);
    expect(missKey.props.accessibilityState).toEqual({ disabled: true });
  });
});
