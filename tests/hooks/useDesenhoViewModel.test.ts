import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryHapticService } from '@/infra/services/memoryHapticService';
import { ValidationError } from '@/model/errors';
import { GameFeedbackUseCases } from '@/usecase/gameFeedbackUseCases';
import type { IGameFeedbackUseCases } from '@/usecase/iGameFeedbackUseCases';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useDesenhoViewModel,
  type DesenhoActions,
  type DesenhoState,
} from '@/viewmodel/useDesenhoViewModel';
import { mockPush, mockReplace } from '../__mocks__/expo-router';

function createHookHarness(
  useCases: IPgPlayUseCases,
  feedback: IGameFeedbackUseCases = new GameFeedbackUseCases(new MemoryHapticService())
) {
  let latestState!: DesenhoState;
  let latestActions!: DesenhoActions;

  const Host = () => {
    const [state, actions] = useDesenhoViewModel(useCases, feedback);
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

describe('useDesenhoViewModel — Hook da Arena de Desenho Relâmpago (UC12)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve iniciar em pass-turn com 90s padrão, gerenciar traços/cores/espessuras e pontuar +20 / -5 (RF41–RF43)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().phase).toBe('pass-turn');
    expect(harness.getState().secondsRemaining).toBe(90);
    expect(harness.getState().totalRounds).toBe(3);

    act(() => {
      harness.getActions().handleStartTurn();
    });
    expect(harness.getState().phase).toBe('drawing');
    expect(harness.getState().wordVisible).toBe(true);
    expect(harness.getState().currentCard?.word).toBe('Arca de Noé');

    // Esconder e mostrar palavra
    act(() => {
      harness.getActions().handleToggleWordVisibility();
    });
    expect(harness.getState().wordVisible).toBe(false);

    // Traços com troca de cor e espessura sem alterar traços anteriores
    act(() => {
      harness.getActions().handleAddStroke([
        { x: 10, y: 10 },
        { x: 40, y: 40 },
      ]);
      harness.getActions().handleSelectColor('purple');
      harness.getActions().handleSelectWidth('thick');
    });
    act(() => {
      harness.getActions().handleAddStroke([{ x: 20, y: 30 }]);
    });

    expect(harness.getState().strokes).toHaveLength(2);
    expect(harness.getState().strokes[0]).toMatchObject({
      colorId: 'ink',
      widthId: 'thin',
    });
    expect(harness.getState().strokes[1]).toMatchObject({
      colorId: 'purple',
      widthId: 'thick',
    });

    // Desfazer e Limpar
    act(() => {
      harness.getActions().handleUndoStroke();
    });
    expect(harness.getState().strokes).toHaveLength(1);

    act(() => {
      harness.getActions().handleClearCanvas();
    });
    expect(harness.getState().strokes).toHaveLength(0);

    // Adiciona traço e registra acerto (+20 pts) -> limpa traços e troca carta
    act(() => {
      harness.getActions().handleAddStroke([{ x: 5, y: 5 }]);
    });
    await act(async () => {
      await harness.getActions().handleHit();
    });
    expect(harness.getState().currentTeam?.score).toBe(20);
    expect(harness.getState().turnHits).toBe(1);
    expect(harness.getState().strokes).toHaveLength(0);
    expect(harness.getState().wordVisible).toBe(true);
    expect(harness.getState().currentCard?.word).toBe('Tábua dos Dez Mandamentos');

    // Pulo (-5 pts) -> limpa traços e troca carta
    act(() => {
      harness.getActions().handleAddStroke([{ x: 8, y: 8 }]);
    });
    await act(async () => {
      await harness.getActions().handleSkip();
    });
    expect(harness.getState().currentTeam?.score).toBe(15);
    expect(harness.getState().turnSkips).toBe(1);
    expect(harness.getState().turnPointsDelta).toBe(15);
    expect(harness.getState().strokes).toHaveLength(0);

    harness.unmount();
  });

  it('deve esgotar o cronômetro com feedback háptico, revelar última palavra no turn-summary e alternar equipes até finished', async () => {
    const haptic = new MemoryHapticService();
    const feedback = new GameFeedbackUseCases(haptic);
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases, feedback);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleSelectDuration(60);
      await harness.getActions().handleSelectRounds(1);
    });
    expect(harness.getState().turnDurationSeconds).toBe(60);
    expect(harness.getState().totalRounds).toBe(1);

    act(() => {
      harness.getActions().handleSetReduceMotion(true);
      harness.getActions().handleStartTurn();
    });
    const activeWordBeforeExpire = harness.getState().currentCard?.word;
    act(() => {
      harness.getActions().handleAddStroke([{ x: 1, y: 2 }]);
    });

    for (let i = 0; i < 60; i += 1) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(harness.getState().phase).toBe('turn-summary');
    expect(harness.getState().secondsRemaining).toBe(0);
    expect(harness.getState().strokes).toHaveLength(0);
    expect(harness.getState().lastTurnCard?.word).toBe(activeWordBeforeExpire);
    // Com reduceMotion=true: sem pulsos, apenas vibração final ao zerar
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 0, expired: 1 });

    // Avança para 2ª equipe
    act(() => {
      harness.getActions().handleNextTurn();
    });
    expect(harness.getState().phase).toBe('pass-turn');
    expect(harness.getState().currentTeam?.name).toBe('Leões da Fé');
    expect(harness.getState().isLastTurn).toBe(true);

    // 2ª equipe joga até acabar o tempo
    act(() => {
      harness.getActions().handleStartTurn();
    });
    for (let i = 0; i < 60; i += 1) {
      act(() => {
        harness.getActions().handleTick();
      });
    }
    expect(harness.getState().phase).toBe('turn-summary');

    act(() => {
      harness.getActions().handleNextTurn();
    });
    expect(harness.getState().phase).toBe('finished');

    act(() => {
      harness.getActions().handleGoToScoreboard();
    });
    expect(mockPush).toHaveBeenCalledWith('/scoreboard');

    harness.unmount();
  });

  it('deve reciclar palavras puladas sem repetir acertos e encerrar ao esgotar banco (RF12, RF30)', async () => {
    const smallCatalog = new MemoryGameCatalogDataSource(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      [
        { id: 'd1', word: 'Girafa', category: 'Animais', points: 20 },
        { id: 'd2', word: 'Polvo', category: 'Animais', points: 20 },
      ]
    );
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      smallCatalog,
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });
    expect(harness.getState().currentCard?.word).toBe('Girafa');

    // Pula Girafa -> vai para Polvo
    await act(async () => {
      await harness.getActions().handleSkip();
    });
    expect(harness.getState().currentCard?.word).toBe('Polvo');

    // Acerta Polvo -> volta Girafa reciclada do skippedDeck
    await act(async () => {
      await harness.getActions().handleHit();
    });
    expect(harness.getState().currentCard?.word).toBe('Girafa');

    // Acerta Girafa -> banco esgotado -> finished
    await act(async () => {
      await harness.getActions().handleHit();
    });
    expect(harness.getState().phase).toBe('finished');
    expect(harness.getState().remainingCardsCount).toBe(0);

    harness.unmount();
  });

  it('deve pausar cronômetro na saída segura, impedir desmarcar último pacote e tratar DomainError (RF11, RF28)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    // Tentar desmarcar todas as categorias mantém a última com categoryWarning
    const categories = [...harness.getState().selectedCategories];
    for (let i = 0; i < categories.length - 1; i += 1) {
      await act(async () => {
        await harness.getActions().handleToggleCategory(categories[i]);
      });
    }
    expect(harness.getState().selectedCategories).toHaveLength(1);
    const lastCat = harness.getState().selectedCategories[0];
    await act(async () => {
      await harness.getActions().handleToggleCategory(lastCat);
    });
    expect(harness.getState().selectedCategories).toEqual([lastCat]);
    expect(harness.getState().categoryWarning).toContain('Selecione pelo menos um pacote');

    // Pausa na confirmação de saída
    act(() => {
      harness.getActions().handleStartTurn();
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(harness.getState().secondsRemaining).toBe(88);

    act(() => {
      harness.getActions().handleRequestExit();
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(harness.getState().secondsRemaining).toBe(88);

    act(() => {
      harness.getActions().handleCancelExit();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(harness.getState().secondsRemaining).toBe(87);

    act(() => {
      harness.getActions().handleRequestExit();
      harness.getActions().handleConfirmExit();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    // Erro de domínio no carregamento
    const failingUseCases: IPgPlayUseCases = {
      listMinigames: async () => [],
      listContentPacks: async () => [],
      listTeams: async () => {
        throw new ValidationError('Falha ao carregar equipes para desenho.');
      },
      addTeam: async () => {
        throw new ValidationError('Erro simulado.');
      },
      removeTeam: async () => {
        throw new ValidationError('Erro simulado.');
      },
      listMimicaCards: async () => [],
      scoreMimicaHit: async () => [],
      scoreMimicaSkip: async () => [],
      listForcaPuzzles: async () => [],
      scoreForcaWord: async () => [],
      listQuizQuestions: async () => [],
      scoreQuizAnswer: async () => [],
      listDesenhoCards: async () => [],
      scoreDesenhoHit: async () => [],
      scoreDesenhoSkip: async () => [],
      getScoreboard: async () => [],
      resetScoreboard: async () => [],
      getMatchSettings: async () => ({
        mimica: { durationSeconds: 60, totalRounds: 3 },
        quiz: { durationSeconds: 20, questionCount: 5 },
        forca: { maxAttempts: 5, totalRounds: 3 },
        desenho: { durationSeconds: 90, totalRounds: 3 },
      }),
      updateMimicaSettings: async () => {
        throw new ValidationError('Erro simulado.');
      },
      updateQuizSettings: async () => {
        throw new ValidationError('Erro simulado.');
      },
      updateForcaSettings: async () => {
        throw new ValidationError('Erro simulado.');
      },
      updateDesenhoSettings: async () => {
        throw new ValidationError('Erro simulado.');
      },
      planQuizMatch: () => ({ totalQuestions: 0, questionsPerTeam: 0, limitedByBank: false }),
      listAvailableQuizQuestionCounts: () => [5],
    };
    const errorHarness = createHookHarness(failingUseCases);
    await errorHarness.mount();
    expect(errorHarness.getState().error).toBe('Falha ao carregar equipes para desenho.');
    errorHarness.unmount();

    harness.unmount();
  });
});
