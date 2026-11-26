import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { DataSourceError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  hasStartedEncounterInSession,
  resetWelcomeSessionForTests,
  useWelcomeViewModel,
  type WelcomeActions,
  type WelcomeState,
} from '@/viewmodel/useWelcomeViewModel';
import { mockPush, mockReplace } from '../__mocks__/expo-router';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: WelcomeState;
  let latestActions!: WelcomeActions;

  const Host = () => {
    const [state, actions] = useWelcomeViewModel(useCases);
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

describe('useWelcomeViewModel — Hook da Tela Inicial (Issue #80 / Issue #93)', () => {
  beforeEach(() => {
    resetWelcomeSessionForTests();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('carrega placar, calcula Top 3 do pódio e total de pontos', async () => {
    const teamDs = new MemoryTeamDataSource();
    await teamDs.addTeam('Tribo Ágape');
    await teamDs.addScore('team-2', 60);
    await teamDs.addScore('team-1', 40);

    const useCases = new PgPlayUseCases(
      teamDs,
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const harness = createHookHarness(useCases);
    await harness.mount();

    const state = harness.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.totalTeams).toBe(3);
    expect(state.totalPoints).toBe(100);
    expect(state.podiumTeams).toHaveLength(3);
    expect(state.podiumTeams[0].id).toBe('team-2');
    expect(state.splashVisible).toBe(true);

    act(() => {
      harness.getActions().handleDismissSplash();
    });
    expect(harness.getState().splashVisible).toBe(false);

    harness.unmount();
  });

  it('executa navegações principais com replace e marca o encontro como iniciado na sessão', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(hasStartedEncounterInSession()).toBe(false);

    act(() => {
      harness.getActions().handleStartGames();
      harness.getActions().handleOpenMultiplayer();
      harness.getActions().handleOpenTeams();
      harness.getActions().handleOpenScoreboard();
    });

    expect(hasStartedEncounterInSession()).toBe(true);
    expect(mockReplace).toHaveBeenNthCalledWith(1, '/');
    expect(mockReplace).toHaveBeenNthCalledWith(2, '/?modality=Multi-Celular');
    expect(mockReplace).toHaveBeenNthCalledWith(3, '/teams');
    expect(mockReplace).toHaveBeenNthCalledWith(4, '/scoreboard');
    expect(mockPush).not.toHaveBeenCalled();

    harness.unmount();
  });

  it('redireciona imediatamente para o Hub e omite splash se /welcome abrir após o encontro iniciado (Issue #93)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const firstMount = createHookHarness(useCases);
    await firstMount.mount();

    expect(firstMount.getState().splashVisible).toBe(true);
    act(() => {
      firstMount.getActions().handleStartGames();
    });
    firstMount.unmount();

    mockReplace.mockClear();

    const secondMount = createHookHarness(useCases);
    await secondMount.mount();

    expect(secondMount.getState().splashVisible).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/');

    secondMount.unmount();
  });

  it('zera o placar após confirmação e converte DomainError em mensagem legível', async () => {
    const teamDs = new MemoryTeamDataSource();
    await teamDs.addScore('team-1', 50);

    const useCases = new PgPlayUseCases(
      teamDs,
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().totalPoints).toBe(50);

    act(() => {
      harness.getActions().handleRequestReset();
    });
    expect(harness.getState().confirmingReset).toBe(true);

    await act(async () => {
      await harness.getActions().handleResetScoreboard();
    });
    expect(harness.getState().confirmingReset).toBe(false);
    expect(harness.getState().totalPoints).toBe(0);

    jest
      .spyOn(useCases, 'resetScoreboard')
      .mockRejectedValueOnce(new DataSourceError('Falha ao zerar pontuação.'));

    await act(async () => {
      await harness.getActions().handleResetScoreboard();
    });
    expect(harness.getState().error).toBe('Falha ao zerar pontuação.');

    await teamDs.addTeam('Nova Equipe');
    await teamDs.addScore('team-1', 25);
    await act(async () => {
      await harness.getActions().handleRetry();
    });
    expect(harness.getState().error).toBeNull();
    expect(harness.getState().totalTeams).toBe(3);
    expect(harness.getState().totalPoints).toBe(25);

    harness.unmount();
  });
});
