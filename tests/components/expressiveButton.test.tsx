import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ExpressiveButton } from '@/view/components/expressiveButton';

describe('ExpressiveButton (RNTL)', () => {
  it('renderiza label e dispara onPress quando habilitado', async () => {
    const onPress = jest.fn();
    await render(<ExpressiveButton label="Iniciar Jogo" icon="play" onPress={onPress} />);

    const button = screen.getByLabelText('Iniciar Jogo');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityState).toEqual({ disabled: false });

    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expõe disabled e accessibilityState.disabled quando desabilitado', async () => {
    const onPress = jest.fn();
    await render(<ExpressiveButton label="Continuar" disabled onPress={onPress} />);

    const button = screen.getByLabelText('Continuar');
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });
});
