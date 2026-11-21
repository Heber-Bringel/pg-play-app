import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useForcaViewModel,
  type ForcaActions,
  type ForcaState,
} from '@/viewmodel/useForcaViewModel';
import { mockPush, mockReplace } from '../__mocks__/expo-router';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: ForcaState;
  let latestActions!: ForcaActions;

  const Host = () => {
    const [state, actions] = useForcaViewModel(useCases);
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

describe('useForcaViewModel — Hook da Arena do Jogo da Forca (UC05)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('deve inicializar na fase pass-turn com palavra mascarada e tentativas configuradas (RF09, RF15)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    const state = harness.getState();
    expect(state.phase).toBe('pass-turn');
    expect(state.teams).toHaveLength(2);
    expect(state.currentTeam?.name).toBe('Tribo de Judá');
    expect(state.maxAttempts).toBe(6);
    expect(state.remainingAttempts).toBe(6);
    expect(state.currentPuzzle?.word).toBe('COMUNHÃO');
    expect(state.maskedWord.length).toBe('COMUNHÃO'.length);
    expect(state.maskedWord.every((l) => !l.revealed)).toBe(true);

    harness.unmount();
  });

  it('deve transitar para playing ao acionar handleStartTurn (RF24)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    expect(harness.getState().phase).toBe('playing');
    expect(harness.getState().remainingAttempts).toBe(6);

    harness.unmount();
  });

  it('deve registrar acerto (Hit) e normalizar acentos ao adivinhar letra correta (RF15)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    await act(async () => {
      await harness.getActions().handleGuessLetter('C');
    });

    let state = harness.getState();
    expect(state.guessedLetters).toContain('C');
    expect(state.maskedWord[0].revealed).toBe(true);
    expect(state.maskedWord[0].original).toBe('C');
    expect(state.remainingAttempts).toBe(6);

    await act(async () => {
      await harness.getActions().handleGuessLetter('A');
    });

    state = harness.getState();
    expect(state.guessedLetters).toContain('A');
    // Em COMUNHÃO, 'Ã' deve ser revelada pelo palpite 'A'
    const aSlot = state.maskedWord.find((l) => l.normalized === 'A');
    expect(aSlot?.revealed).toBe(true);
    expect(aSlot?.original).toBe('Ã');

    harness.unmount();
  });

  it('deve registrar erro (Miss) e decrementar tentativa ao errar letra (RF15)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    await act(async () => {
      await harness.getActions().handleGuessLetter('Z');
    });

    const state = harness.getState();
    expect(state.guessedLetters).toContain('Z');
    expect(state.remainingAttempts).toBe(5);
    expect(state.phase).toBe('playing');

    harness.unmount();
  });

  it('deve declarar derrota e revelar a palavra quando tentativas esgotam (RF27)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    const wrongLetters = ['Z', 'X', 'V', 'K', 'J', 'W'];
    for (const char of wrongLetters) {
      await act(async () => {
        await harness.getActions().handleGuessLetter(char);
      });
    }

    const state = harness.getState();
    expect(state.remainingAttempts).toBe(0);
    expect(state.wordLost).toBe(true);
    expect(state.phase).toBe('word-result');
    expect(state.earnedPoints).toBe(0);
    expect(state.maskedWord.every((l) => l.revealed)).toBe(true);

    harness.unmount();
  });

  it('deve somar +30 pts mais bônus de tentativas restantes na vitória (RF27)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    // COMUNHÃO possui letras únicas: C, O, M, U, N, H, A
    const letters = ['C', 'O', 'M', 'U', 'N', 'H', 'A'];
    for (const char of letters) {
      await act(async () => {
        await harness.getActions().handleGuessLetter(char);
      });
    }

    const state = harness.getState();
    expect(state.wordWon).toBe(true);
    expect(state.phase).toBe('word-result');
    expect(state.remainingAttempts).toBe(6);
    expect(state.bonusPoints).toBe(12); // 6 * 2
    expect(state.earnedPoints).toBe(42); // 30 + 12

    const team = state.teams.find((t) => t.id === 'team-1');
    expect(team?.score).toBe(42);

    harness.unmount();
  });

  it('deve reiniciar a palavra com handleResetWord restaurando tentativas e palpites', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    act(() => {
      harness.getActions().handleStartTurn();
    });

    await act(async () => {
      await harness.getActions().handleGuessLetter('C');
    });
    await act(async () => {
      await harness.getActions().handleGuessLetter('Z');
    });

    expect(harness.getState().remainingAttempts).toBe(5);
    expect(harness.getState().guessedLetters).toHaveLength(2);

    act(() => {
      harness.getActions().handleResetWord();
    });

    const resetState = harness.getState();
    expect(resetState.remainingAttempts).toBe(6);
    expect(resetState.guessedLetters).toHaveLength(0);
    expect(resetState.maskedWord.every((l) => !l.revealed)).toBe(true);

    harness.unmount();
  });

  it('deve avançar equipes com handleNextWord e finalizar ao terminar rodadas (RF12)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
    const harness = createHookHarness(useCases);

    await harness.mount();

    await act(async () => {
      await harness.getActions().handleSelectRounds(1);
    });

    act(() => {
      harness.getActions().handleNextWord(); // Equipe 1 -> Equipe 2
    });
    expect(harness.getState().currentTeamIndex).toBe(1);
    expect(harness.getState().phase).toBe('pass-turn');

    act(() => {
      harness.getActions().handleNextWord(); // Fim de 1 rodada com 2 equipes
    });
    expect(harness.getState().phase).toBe('finished');

    act(() => {
      harness.getActions().handleGoToScoreboard();
    });
    expect(mockReplace).toHaveBeenCalledWith('/scoreboard');

    harness.unmount();
  });

  it('deve gerenciar confirmação de saída com handleRequestExit e handleConfirmExit (RF11)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());
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

    harness.unmount();
  });

  it('deve converter DomainError em mensagem de erro legível no estado', async () => {
    const failingUseCases: IPgPlayUseCases = {
      listMinigames: async () => [],
      listTeams: async () => {
        throw new ValidationError('Erro simulado ao carregar equipes.');
      },
      addTeam: async () => {
        throw new ValidationError('Erro simulado ao adicionar equipe.');
      },
      removeTeam: async () => {
        throw new ValidationError('Erro simulado ao remover equipe.');
      },
      listMimicaCards: async () => [],
      scoreMimicaHit: async () => [],
      scoreMimicaSkip: async () => [],
      listForcaPuzzles: async () => [],
      scoreForcaWord: async () => [],
      listQuizQuestions: async () => [],
      scoreQuizAnswer: async () => [],
      getScoreboard: async () => [],
      awardBonusPoints: async () => [],
      resetScoreboard: async () => [],
      getMatchSettings: async () => ({
        mimica: { durationSeconds: 60, totalRounds: 3 },
        quiz: { durationSeconds: 20, questionCount: 5 },
        forca: { maxAttempts: 5, totalRounds: 3 },
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
      planQuizMatch: () => ({ totalQuestions: 0, questionsPerTeam: 0, limitedByBank: false }),
    };
    const errorHarness = createHookHarness(failingUseCases);
    await errorHarness.mount();
    expect(errorHarness.getState().error).toBe('Erro simulado ao carregar equipes.');
    errorHarness.unmount();
  });
});
