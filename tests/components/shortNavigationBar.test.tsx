import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ShortNavigationBar } from '@/view/components/shortNavigationBar';

describe('ShortNavigationBar (Material 3 Expressive)', () => {
  it('renderiza os 3 destinos globais da sessão (Início, Equipes, Placar) e destaca o destino ativo', async () => {
    const onSelect = jest.fn();

    await render(<ShortNavigationBar activeKey="games" onSelect={onSelect} />);

    expect(screen.getByText('Início')).toBeTruthy();
    expect(screen.getByText('Equipes')).toBeTruthy();
    expect(screen.getByText('Placar')).toBeTruthy();
    expect(screen.queryByText('Jogos')).toBeNull();
    expect(screen.queryByText('Config.')).toBeNull();

    const homeTab = screen.getByLabelText('Ir para Início');
    const teamsTab = screen.getByLabelText('Ir para Equipes');
    const scoreboardTab = screen.getByLabelText('Ir para Placar');
    expect(homeTab.props.accessibilityRole).toBe('tab');
    expect(homeTab.props.accessibilityState).toEqual({ selected: true });
    expect(teamsTab.props.accessibilityRole).toBe('tab');
    expect(teamsTab.props.accessibilityState).toEqual({ selected: false });
    expect(scoreboardTab.props.accessibilityRole).toBe('tab');
    expect(scoreboardTab.props.accessibilityState).toEqual({ selected: false });
  });

  it('dispara onSelect com a chave correta ao tocar em cada destino', async () => {
    const onSelect = jest.fn();

    await render(<ShortNavigationBar activeKey="games" onSelect={onSelect} />);

    await fireEvent.press(screen.getByLabelText('Ir para Equipes'));
    await fireEvent.press(screen.getByLabelText('Ir para Placar'));
    await fireEvent.press(screen.getByLabelText('Ir para Início'));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'teams');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'scoreboard');
    expect(onSelect).toHaveBeenNthCalledWith(3, 'games');
  });
});
