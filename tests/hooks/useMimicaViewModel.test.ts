import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useMimicaViewModel,
  type MimicaActions,
  type MimicaState,
} from '@/viewmodel/useMimicaViewModel';
import { mockPush, mockReplace } from '../__mocks__/expo-router';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: MimicaState;
  let latestActions!: MimicaActions;

  const Host = () => {
    const [state, actions] = useMimicaViewModel(useCases);
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

describe('useMimicaViewModel — Hook da Arena de Mímica Expressiva (UC03)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve iniciar na fase de passagem de turno (pass-turn) com 2 equipes e palavra protegida (RF09, RF24)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    const state = harness.getState();
    expect(state.loading).toBe(false);
    expect(state.phase).toBe('pass-turn');
    expect(state.currentTeam?.name).toBe('Tribo de Judá');
    expect(state.secondsRemaining).toBe(60);
    expect(state.currentCard?.word).toBe('Davi e Golias');

    harness.unmount();
  });

  it('deve iniciar o turno ao tocar em Estou Pronto, ocultar/revelar palavra, pontuar +20 e pular -5 (RF13, RF25)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });
    expect(harness.getState().phase).toBe('playing');
    expect(harness.getState().wordVisible).toBe(true);

    act(() => {
      harness.getActions().handleToggleWordVisibility();
    });
    expect(harness.getState().wordVisible).toBe(false);

    await act(async () => {
      await harness.getActions().handleHit();
    });
    expect(harness.getState().currentTeam?.score).toBe(20);
    expect(harness.getState().turnHits).toBe(1);
    expect(harness.getState().turnPointsDelta).toBe(20);
    expect(harness.getState().wordVisible).toBe(true);
    expect(harness.getState().currentCard?.word).toBe('Arca de Noé');

    await act(async () => {
      await harness.getActions().handleSkip();
    });
    expect(harness.getState().currentTeam?.score).toBe(15);
    expect(harness.getState().turnSkips).toBe(1);
    expect(harness.getState().turnPointsDelta).toBe(15);

    harness.unmount();
  });

  it('deve decrementar o cronômetro até 00:00, exibir resumo do turno e alternar entre equipes e rodadas (RF10, RF31)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleSelectRounds(1);
      harness.getActions().handleSelectDuration(45);
    });

    await act(async () => {
      await harness.getActions().handleToggleCategory('Cultura Pop');
    });

    act(() => {
      harness.getActions().handleStartTurn();
    });
    expect(harness.getState().secondsRemaining).toBe(45);

    act(() => {
      for (let i = 0; i < 45; i += 1) {
        harness.getActions().handleTick();
      }
    });
    expect(harness.getState().secondsRemaining).toBe(0);
    expect(harness.getState().phase).toBe('turn-summary');

    act(() => {
      harness.getActions().handleNextTurn();
    });
    expect(harness.getState().phase).toBe('pass-turn');
    expect(harness.getState().currentTeam?.name).toBe('Leões da Fé');

    act(() => {
      harness.getActions().handleStartTurn();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
      for (let i = 0; i < 44; i += 1) {
        harness.getActions().handleTick();
      }
    });
    expect(harness.getState().phase).toBe('turn-summary');

    act(() => {
      harness.getActions().handleNextTurn();
    });
    expect(harness.getState().phase).toBe('finished');

    await act(async () => {
      await harness.getActions().handleRetry();
    });
    expect(harness.getState().loading).toBe(false);

    act(() => {
      harness.getActions().handleGoToScoreboard();
    });
    expect(mockPush).toHaveBeenCalledWith('/scoreboard');

    harness.unmount();
  });

  it('deve encerrar a partida automaticamente quando todas as cartas do pacote forem acertadas (RF12, RF30)', async () => {
    const smallCatalog = new MemoryGameCatalogDataSource([
      { id: 'c1', word: 'Davi', category: 'Bíblico', points: 20 },
    ]);
    const useCases = new PgPlayUseCases(new MemoryTeamDataSource(), smallCatalog);
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    await act(async () => {
      await harness.getActions().handleHit();
    });

    expect(harness.getState().phase).toBe('finished');
    expect(harness.getState().remainingCardsCount).toBe(0);

    harness.unmount();
  });

  it('deve tratar confirmação de saída segura e erros de validação de categorias (RF11, RF28)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleRequestExit();
    });
    expect(harness.getState().confirmingExit).toBe(true);

    act(() => {
      harness.getActions().handleCancelExit();
    });
    expect(harness.getState().confirmingExit).toBe(false);

    act(() => {
      harness.getActions().handleRequestExit();
      harness.getActions().handleConfirmExit();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    const failingUseCases: IPgPlayUseCases = {
      listTeams: async () => {
        throw new ValidationError('Erro simulado ao carregar equipes.');
      },
      listMimicaCards: async () => [],
      scoreMimicaHit: async () => [],
      scoreMimicaSkip: async () => [],
    };
    const errorHarness = createHookHarness(failingUseCases);
    await errorHarness.mount();
    expect(errorHarness.getState().error).toBe('Erro simulado ao carregar equipes.');

    errorHarness.unmount();
  });
});
