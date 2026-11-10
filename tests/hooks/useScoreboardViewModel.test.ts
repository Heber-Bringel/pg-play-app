import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useScoreboardViewModel,
  type ScoreboardActions,
  type ScoreboardState,
} from '@/viewmodel/useScoreboardViewModel';
import { mockPush } from '../__mocks__/expo-router';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: ScoreboardState;
  let latestActions!: ScoreboardActions;

  const Host = () => {
    const [state, actions] = useScoreboardViewModel(useCases);
    latestState = state;
    latestActions = actions;
    return null;
  };

  let tree!: renderer.ReactTestRenderer;
  return {
    mount: async () => {
      await act(async () => {
        tree = renderer.create(React.createElement(Host));
      });
    },
    unmount: () => {
      act(() => {
        tree.unmount();
      });
    },
    getState: () => latestState,
    getActions: () => latestActions,
  };
}

describe('useScoreboardViewModel — Hook do Placar e Ranking Geral do PG (UC06)', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('deve carregar o ranking ordenado, identificar a equipe líder e somar o total de pontos (RF16)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource([
        { id: 'team-1', name: 'Tribo de Judá', score: 20 },
        { id: 'team-2', name: 'Leões da Fé', score: 40 },
      ]),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    const state = harness.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.leaderTeam?.name).toBe('Leões da Fé');
    expect(state.totalPoints).toBe(60);
    expect(state.teams.map((t) => t.id)).toEqual(['team-2', 'team-1']);

    harness.unmount();
  });

  it('deve conceder bônus, zerar placar e navegar para escolher outro jogo (RF16, RF17)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource([
        { id: 'team-1', name: 'Tribo de Judá', score: 20 },
        { id: 'team-2', name: 'Leões da Fé', score: 25 },
      ]),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleAwardBonus('team-1', 10);
    });
    expect(harness.getState().leaderTeam?.name).toBe('Tribo de Judá');
    expect(harness.getState().leaderTeam?.score).toBe(30);

    await act(async () => {
      await harness.getActions().handleResetScoreboard();
    });
    expect(harness.getState().totalPoints).toBe(0);
    expect(harness.getState().teams.every((t) => t.score === 0)).toBe(true);

    await act(async () => {
      await harness.getActions().handleRetry();
    });
    expect(harness.getState().loading).toBe(false);

    act(() => {
      harness.getActions().handleChooseAnotherGame();
    });
    expect(mockPush).toHaveBeenCalledWith('/');

    harness.unmount();
  });

  it('deve converter DomainError em mensagem de erro legível na ViewModel', async () => {
    const failingUseCases: IPgPlayUseCases = {
      listTeams: async () => [],
      listMimicaCards: async () => [],
      scoreMimicaHit: async () => [],
      scoreMimicaSkip: async () => [],
      listForcaPuzzles: async () => [],
      scoreForcaWord: async () => [],
      getScoreboard: async () => {
        throw new ValidationError('Falha ao consultar o placar.');
      },
      awardBonusPoints: async () => {
        throw new ValidationError('Equipe inválida para bônus.');
      },
      resetScoreboard: async () => {
        throw new ValidationError('Falha ao zerar placar.');
      },
    };

    const harness = createHookHarness(failingUseCases);
    await harness.mount();
    expect(harness.getState().error).toBe('Falha ao consultar o placar.');

    await act(async () => {
      await harness.getActions().handleAwardBonus('invalida');
    });
    expect(harness.getState().error).toBe('Equipe inválida para bônus.');

    await act(async () => {
      await harness.getActions().handleResetScoreboard();
    });
    expect(harness.getState().error).toBe('Falha ao zerar placar.');

    harness.unmount();
  });
});
