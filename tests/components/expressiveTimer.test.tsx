import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ExpressiveTimer } from '@/view/components/expressiveTimer';

describe('ExpressiveTimer (RNTL)', () => {
  it('renderiza estado normal acima de 10 segundos', async () => {
    await render(<ExpressiveTimer secondsRemaining={45} reduceMotion />);

    const timer = screen.getByLabelText('Tempo restante: 45 segundos');
    expect(timer.props.accessibilityRole).toBe('timer');
    expect(timer.props.accessibilityLiveRegion).toBe('none');
    expect(screen.getByText('00:45')).toBeTruthy();
  });

  it('ativa estado crítico com liveRegion assertive quando <= 10 segundos', async () => {
    await render(<ExpressiveTimer secondsRemaining={8} reduceMotion />);

    const timer = screen.getByLabelText('Tempo restante: 8 segundos');
    expect(timer.props.accessibilityRole).toBe('timer');
    expect(timer.props.accessibilityLiveRegion).toBe('assertive');
    expect(screen.getByText('00:08')).toBeTruthy();
  });

  it('exibe Tempo esgotado quando segundos chegam a 0', async () => {
    await render(<ExpressiveTimer secondsRemaining={0} reduceMotion />);

    const timer = screen.getByLabelText('Tempo esgotado');
    expect(timer.props.accessibilityRole).toBe('timer');
    expect(screen.getByText('00:00')).toBeTruthy();
  });
});
