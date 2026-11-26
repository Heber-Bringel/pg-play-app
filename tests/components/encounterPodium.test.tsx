import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Team } from '@/model/entities/team';
import { EncounterPodium } from '@/view/components/encounterPodium';

const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Leões de Judá', score: 60 },
  { id: 't2', name: 'Filhos da Luz', score: 50 },
  { id: 't3', name: 'Tribo Ágape', score: 30 },
];

describe('EncounterPodium', () => {
  it('renderiza as 3 colunas do pódio sem texto redundante no 1º lugar', async () => {
    const onOpenScoreboard = jest.fn();
    const onRequestReset = jest.fn();

    await render(
      <EncounterPodium
        teams={MOCK_TEAMS}
        totalPoints={140}
        onOpenScoreboard={onOpenScoreboard}
        onRequestReset={onRequestReset}
      />
    );

    expect(screen.getByText('Pódio do Encontro')).toBeTruthy();
    expect(screen.getByText('1º')).toBeTruthy();
    expect(screen.getByText('2º')).toBeTruthy();
    expect(screen.getByText('3º')).toBeTruthy();
    expect(screen.getByText('Leões de Judá')).toBeTruthy();
    expect(screen.getByText('60 pts')).toBeTruthy();
    expect(screen.queryByText('1º lugar · Líder')).toBeNull();

    const scoreboardBtn = screen.getByLabelText('Ver placar completo');
    expect(scoreboardBtn.props.accessibilityRole).toBe('button');

    await fireEvent.press(scoreboardBtn);
    await fireEvent.press(screen.getByLabelText('Zerar'));

    expect(onOpenScoreboard).toHaveBeenCalledTimes(1);
    expect(onRequestReset).toHaveBeenCalledTimes(1);
  });

  it('suporta 1 ou 2 equipes e desabilita Zerar quando totalPoints é 0', async () => {
    const onOpenScoreboard = jest.fn();
    const onRequestReset = jest.fn();

    await render(
      <EncounterPodium
        teams={[{ id: 't1', name: 'Equipe Única', score: 0 }]}
        totalPoints={0}
        onOpenScoreboard={onOpenScoreboard}
        onRequestReset={onRequestReset}
      />
    );

    expect(screen.getByText('Equipe Única')).toBeTruthy();
    expect(screen.queryByText('2º')).toBeNull();

    const resetBtn = screen.getByLabelText('Zerar');
    expect(resetBtn.props.disabled).toBe(true);
    expect(resetBtn.props.accessibilityState).toEqual({ disabled: true });
  });
});
