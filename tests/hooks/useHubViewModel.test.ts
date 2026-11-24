import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { DataSourceError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useHubViewModel,
  type HubActions,
  type HubState,
} from '@/viewmodel/useHubViewModel';
import { mockPush } from '../__mocks__/expo-router';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: HubState;
  let latestActions!: HubActions;

  const Host = () => {
    const [state, actions] = useHubViewModel(useCases);
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

describe('useHubViewModel — Hook do Hub de Jogos (UC01)', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('deve carregar os 5 minigames e a equipe líder ordenada ao montar (RF01, RF02)', async () => {
    const teamDs = new MemoryTeamDataSource();
    await teamDs.addScore('team-2', 40);
    const useCases = new PgPlayUseCases(teamDs, new MemoryGameCatalogDataSource(), new MemoryMatchSettingsDataSource());

    const harness = createHookHarness(useCases);
    await harness.mount();

    const state = harness.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.games).toHaveLength(8);
    expect(state.allGamesCount).toBe(8);
    expect(state.totalTeams).toBe(2);
    expect(state.leaderTeam?.id).toBe('team-2');
    expect(state.leaderTeam?.score).toBe(40);
    expect(state.selectedModality).toBe('Todos');

    harness.unmount();
  });

  it('deve filtrar jogos em tempo real por busca e modalidade e limpar filtros (RF03, RF04)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().setSelectedModality('1 Celular');
    });
    expect(harness.getState().selectedModality).toBe('1 Celular');
    expect(harness.getState().games).toHaveLength(6);

    await act(async () => {
      await harness.getActions().setSearchQuery('quiz');
    });
    expect(harness.getState().searchQuery).toBe('quiz');
    expect(harness.getState().games.map((g) => g.id)).toEqual(['quiz']);

    await act(async () => {
      await harness.getActions().handleClearFilters();
    });
    expect(harness.getState().searchQuery).toBe('');
    expect(harness.getState().selectedModality).toBe('Todos');
    expect(harness.getState().games).toHaveLength(8);

    harness.unmount();
  });

  it('deve navegar para minigames disponíveis, equipes e placar, ignorando jogos indisponíveis', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const harness = createHookHarness(useCases);
    await harness.mount();

    const mimica = harness.getState().games.find((g) => g.id === 'mimica')!;
    const cidadeDorme = harness
      .getState()
      .games.find((g) => g.id === 'cidade-dorme')!;
    const unavailableGame = { ...cidadeDorme, available: false };

    act(() => {
      harness.getActions().handleSelectGame(unavailableGame);
    });
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      harness.getActions().handleSelectGame(cidadeDorme);
    });
    expect(mockPush).toHaveBeenCalledWith('/cidade-dorme');

    act(() => {
      harness.getActions().handleSelectGame(mimica);
    });
    expect(mockPush).toHaveBeenCalledWith('/mimica');

    act(() => {
      harness.getActions().handleOpenTeams();
      harness.getActions().handleOpenScoreboard();
    });
    expect(mockPush).toHaveBeenCalledWith('/teams');
    expect(mockPush).toHaveBeenCalledWith('/scoreboard');

    harness.unmount();
  });

  it('deve converter DomainError em estado de erro legível e permitir tentar novamente', async () => {
    let shouldFail = true;
    const baseUseCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const flakyUseCases: IPgPlayUseCases = {
      listMinigames: async (query, modality) => {
        if (shouldFail) {
          throw new DataSourceError('Falha ao ler catálogo de minigames.');
        }
        return baseUseCases.listMinigames(query, modality);
      },
      listContentPacks: (g) => baseUseCases.listContentPacks(g),
      listTeams: () => baseUseCases.listTeams(),
      addTeam: (name) => baseUseCases.addTeam(name),
      removeTeam: (id) => baseUseCases.removeTeam(id),
      listMimicaCards: (c) => baseUseCases.listMimicaCards(c),
      scoreMimicaHit: (id, pts) => baseUseCases.scoreMimicaHit(id, pts),
      scoreMimicaSkip: (id, pen) => baseUseCases.scoreMimicaSkip(id, pen),
      listForcaPuzzles: (c) => baseUseCases.listForcaPuzzles(c),
      scoreForcaWord: (id, rem) => baseUseCases.scoreForcaWord(id, rem),
      listQuizQuestions: (c) => baseUseCases.listQuizQuestions(c),
      scoreQuizAnswer: (id, ok, pts) => baseUseCases.scoreQuizAnswer(id, ok, pts),
      getScoreboard: () => baseUseCases.getScoreboard(),
      resetScoreboard: () => baseUseCases.resetScoreboard(),
      getMatchSettings: () => baseUseCases.getMatchSettings(),
      updateMimicaSettings: (s) => baseUseCases.updateMimicaSettings(s),
      updateQuizSettings: (s) => baseUseCases.updateQuizSettings(s),
      updateForcaSettings: (s) => baseUseCases.updateForcaSettings(s),
      planQuizMatch: (count, available, teamCount) =>
        baseUseCases.planQuizMatch(count, available, teamCount),
      listAvailableQuizQuestionCounts: (available) =>
        baseUseCases.listAvailableQuizQuestionCounts(available),
    };

    const harness = createHookHarness(flakyUseCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().error).toBe('Falha ao ler catálogo de minigames.');

    shouldFail = false;
    await act(async () => {
      await harness.getActions().handleRetry();
    });

    expect(harness.getState().error).toBeNull();
    expect(harness.getState().games).toHaveLength(8);

    harness.unmount();
  });
});
