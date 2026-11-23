import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useQuizViewModel,
  type QuizActions,
  type QuizQuestionCountOption,
  type QuizState,
} from '@/viewmodel/useQuizViewModel';
import { mockPush, mockReplace } from '../__mocks__/expo-router';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: QuizState;
  let latestActions!: QuizActions;

  const Host = () => {
    const [state, actions] = useQuizViewModel(useCases);
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

describe('useQuizViewModel — Hook da Arena de Quiz Relâmpago (UC04)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('deve carregar dados, iniciar em pass-turn com 2 equipes e pergunta carregada (RF09)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    const state = harness.getState();
    expect(state.loading).toBe(false);
    expect(state.phase).toBe('pass-turn');
    expect(state.teams).toHaveLength(2);
    expect(state.currentTeam?.name).toBe('Tribo de Judá');
    // Padrão da doc do jogo: 10 perguntas, 5 por equipe com 2 equipes.
    expect(state.totalQuestions).toBe(10);
    expect(state.questionsPerTeam).toBe(5);
    expect(state.configuredQuestionCount).toBe(10);
    // O pacote padrão tem 12 perguntas: 15 não é oferecido.
    expect(state.availableQuestionCounts).toEqual([5, 10]);
    expect(state.questionCountNotice).toBeNull();
    expect(state.currentQuestion).toBeDefined();

    // 5 perguntas com 2 equipes viram 4 (2 por equipe) para a alternância ser justa.
    await act(async () => {
      await harness.getActions().handleSelectQuestionCount(5);
    });
    expect(harness.getState().totalQuestions).toBe(4);
    expect(harness.getState().questionsPerTeam).toBe(2);
    expect(harness.getState().questionCountNotice).toContain('2 por equipe');

    // Toques seguidos não podem sobrescrever um ao outro (fila no UseCase).
    await act(async () => {
      await Promise.all([
        harness.getActions().handleSelectDuration(30),
        harness.getActions().handleSelectQuestionCount(10),
      ]);
    });
    expect(harness.getState().turnDurationSeconds).toBe(30);
    expect(harness.getState().configuredQuestionCount).toBe(10);
    expect(harness.getState().totalQuestions).toBe(10);
    expect(harness.getState().questionCountNotice).toBeNull();
    const persisted = await useCases.getMatchSettings();
    expect(persisted.quiz).toEqual({ durationSeconds: 30, questionCount: 10 });

    harness.unmount();
  });

  it('deve transitar para playing ao acionar handleStartTurn (RF09, RF10)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    const state = harness.getState();
    expect(state.phase).toBe('playing');
    expect(state.secondsRemaining).toBe(20);
    expect(state.selectedOptionKey).toBeNull();

    harness.unmount();
  });

  it('deve pontuar +10 pts ao selecionar a alternativa correta (RF14, RF26)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    const correctKey = harness.getState().currentQuestion!.correctKey;

    await act(async () => {
      await harness.getActions().handleSelectOption(correctKey);
    });

    const state = harness.getState();
    expect(state.phase).toBe('answered');
    expect(state.isCorrect).toBe(true);
    expect(state.selectedOptionKey).toBe(correctKey);
    expect(state.turnScoreDelta).toBe(10);
    expect(state.currentTeam?.score).toBe(10);

    harness.unmount();
  });

  it('deve marcar erro e não pontuar ao selecionar alternativa incorreta (RF14, RF26)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    const correctKey = harness.getState().currentQuestion!.correctKey;
    const wrongKey = correctKey === 'A' ? 'B' : 'A';

    await act(async () => {
      await harness.getActions().handleSelectOption(wrongKey);
    });

    const state = harness.getState();
    expect(state.phase).toBe('answered');
    expect(state.isCorrect).toBe(false);
    expect(state.selectedOptionKey).toBe(wrongKey);
    expect(state.turnScoreDelta).toBe(0);
    expect(state.currentTeam?.score).toBe(0);

    harness.unmount();
  });

  it('deve bloquear novos toques após responder a pergunta', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    const correctKey = harness.getState().currentQuestion!.correctKey;

    await act(async () => {
      await harness.getActions().handleSelectOption(correctKey);
    });

    const wrongKey = correctKey === 'A' ? 'B' : 'A';
    await act(async () => {
      await harness.getActions().handleSelectOption(wrongKey);
    });

    expect(harness.getState().selectedOptionKey).toBe(correctKey);

    harness.unmount();
  });

  it('deve esgotar o tempo ao chamar handleTick repetidamente e marcar erro (RF10)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    // Simula contagem regressiva até zero
    for (let i = 0; i < 20; i++) {
      act(() => {
        harness.getActions().handleTick();
      });
    }

    const state = harness.getState();
    expect(state.secondsRemaining).toBe(0);
    expect(state.phase).toBe('answered');
    expect(state.isCorrect).toBe(false);

    harness.unmount();
  });

  it('deve avançar para a próxima equipe e pergunta ao chamar handleNextQuestion', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    await act(async () => {
      await harness.getActions().handleSelectOption('A');
    });

    act(() => {
      harness.getActions().handleNextQuestion();
    });

    const state = harness.getState();
    expect(state.phase).toBe('pass-turn');
    expect(state.currentQuestionIndex).toBe(1);
    expect(state.currentTeamIndex).toBe(1);
    expect(state.currentTeam?.name).toBe('Leões da Fé');

    harness.unmount();
  });

  it('deve transitar para finished ao concluir a última pergunta (RF12)', async () => {
    const customQuestions = [
      {
        id: 'q1',
        question: 'P1?',
        options: [
          { key: 'A' as const, text: 'Opt1' },
          { key: 'B' as const, text: 'Opt2' },
          { key: 'C' as const, text: 'Opt3' },
          { key: 'D' as const, text: 'Opt4' },
        ],
        correctKey: 'A' as const,
        category: 'Bíblico' as const,
      },
    ];

    const catalogDs = new MemoryGameCatalogDataSource(undefined, undefined, customQuestions);
    const useCases = new PgPlayUseCases(new MemoryTeamDataSource(), catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    await act(async () => {
      await harness.getActions().handleSelectOption('A');
    });

    act(() => {
      harness.getActions().handleNextQuestion();
    });

    expect(harness.getState().phase).toBe('finished');

    harness.unmount();
  });

  it('deve tratar saída segura e navegação ao placar (RF11, RF12)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
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
      harness.getActions().handleConfirmExit();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    act(() => {
      harness.getActions().handleGoToScoreboard();
    });
    expect(mockPush).toHaveBeenCalledWith('/scoreboard');

    harness.unmount();
  });

  it('deve sinalizar isLastQuestion apenas na última pergunta configurada', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    // 5 perguntas com 2 equipes viram 4 (alternância justa).
    await act(async () => {
      await harness.getActions().handleSelectQuestionCount(5);
    });
    expect(harness.getState().totalQuestions).toBe(4);

    for (let i = 0; i < 3; i += 1) {
      expect(harness.getState().isLastQuestion).toBe(false);
      act(() => {
        harness.getActions().handleNextQuestion();
      });
    }
    expect(harness.getState().currentQuestionIndex).toBe(3);
    expect(harness.getState().isLastQuestion).toBe(true);

    act(() => {
      harness.getActions().handleNextQuestion();
    });
    expect(harness.getState().phase).toBe('finished');

    harness.unmount();
  });

  it('deve marcar o chip na hora e voltar ao valor salvo quando o UseCase rejeitar', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    let pending!: Promise<void>;
    act(() => {
      pending = harness.getActions().handleSelectDuration(30);
    });
    // Atualização otimista: o chip já aparece selecionado antes da gravação.
    expect(harness.getState().turnDurationSeconds).toBe(30);
    await act(async () => {
      await pending;
    });

    await act(async () => {
      await harness
        .getActions()
        .handleSelectQuestionCount(25 as QuizQuestionCountOption);
    });
    expect(harness.getState().error).toBe(
      'A quantidade de perguntas do Quiz deve ser 5, 10 ou 15.'
    );
    expect(harness.getState().configuredQuestionCount).toBe(10);
    expect(harness.getState().turnDurationSeconds).toBe(30);

    harness.unmount();
  });
});
