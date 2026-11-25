import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ShortNavigationBar } from '@/view/components/shortNavigationBar';

describe('ShortNavigationBar (Material 3 Expressive)', () => {
  it('renderiza os 3 destinos globais sem Config. e destaca o destino ativo', async () => {
    const onSelect = jest.fn();

    await render(<ShortNavigationBar activeKey="welcome" onSelect={onSelect} />);

    expect(screen.getByText('Início')).toBeTruthy();
    expect(screen.getByText('Jogos')).toBeTruthy();
    expect(screen.getByText('Equipes')).toBeTruthy();
    expect(screen.queryByText('Config.')).toBeNull();

    const homeTab = screen.getByLabelText('Ir para Início');
    const gamesTab = screen.getByLabelText('Ir para Jogos');
    expect(homeTab.props.accessibilityRole).toBe('tab');
    expect(homeTab.props.accessibilityState).toEqual({ selected: true });
    expect(gamesTab.props.accessibilityRole).toBe('tab');
    expect(gamesTab.props.accessibilityState).toEqual({ selected: false });
  });

  it('dispara onSelect com a chave correta ao tocar em cada destino', async () => {
    const onSelect = jest.fn();

    await render(<ShortNavigationBar activeKey="welcome" onSelect={onSelect} />);

    await fireEvent.press(screen.getByLabelText('Ir para Jogos'));
    await fireEvent.press(screen.getByLabelText('Ir para Equipes'));
    await fireEvent.press(screen.getByLabelText('Ir para Início'));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'games');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'teams');
    expect(onSelect).toHaveBeenNthCalledWith(3, 'welcome');
  });
});
