import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { ValidationError } from '@/model/errors';
import { AdedonhaUseCases } from '@/usecase/adedonhaUseCases';
import type { IAdedonhaUseCases } from '@/usecase/iAdedonhaUseCases';
import {
  useAdedonhaViewModel,
  type AdedonhaActions,
  type AdedonhaState,
} from '@/viewmodel/useAdedonhaViewModel';
import { mockPush } from '../__mocks__/expo-router';

function createHookHarness(useCases: IAdedonhaUseCases) {
  let latestState!: AdedonhaState;
  let latestActions!: AdedonhaActions;

  const Host = () => {
    const [state, actions] = useAdedonhaViewModel(useCases);
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

describe('useAdedonhaViewModel — Hook da Adedonha Bíblica em Sala Multiplayer (UC08)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve carregar o Lobby, adicionar/remover colunas e girar a Roleta Expressiva (RF21)', async () => {
    const useCases = new AdedonhaUseCases(new MemoryMultiplayerRoomService());
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().room?.phase).toBe('lobby');
    expect(harness.getState().room?.config.columns).toHaveLength(3);

    await act(async () => {
      const ok = await harness
        .getActions()
        .handleAddColumn('Milagre ou Parábola');
      expect(ok).toBe(true);
    });
    expect(harness.getState().room?.config.columns).toContain(
      'Milagre ou Parábola'
    );

    await act(async () => {
      await harness.getActions().handleRemoveColumn('Milagre ou Parábola');
    });
    expect(harness.getState().room?.config.columns).toHaveLength(3);

    await act(async () => {
      await harness
        .getActions()
        .handleUpdateConfig({ roundDurationSeconds: 60 });
    });
    expect(harness.getState().secondsRemaining).toBe(60);

    await act(async () => {
      await harness.getActions().handleSpinRoulette('D');
    });
    expect(harness.getState().room?.phase).toBe('filling');
    expect(harness.getState().room?.currentLetter).toBe('D');

    harness.unmount();
  });

  it('deve validar letra inicial em tempo real, acionar ADEDONHA!, levantar dúvida e julgar na apuração (RF22, RF23)', async () => {
    const useCases = new AdedonhaUseCases(new MemoryMultiplayerRoomService());
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleSpinRoulette('D');
    });

    act(() => {
      harness
        .getActions()
        .handleChangeAnswer('Personagem Bíblico', 'Moisés');
    });
    expect(harness.getState().fieldErrors['Personagem Bíblico']).toBe(
      'A resposta deve começar com a letra D'
    );
    expect(harness.getState().canTriggerAdedonha).toBe(false);

    act(() => {
      harness.getActions().handleChangeAnswer('Personagem Bíblico', 'Davi');
      harness.getActions().handleChangeAnswer('Livro da Bíblia', 'Daniel');
      harness
        .getActions()
        .handleChangeAnswer('Cidade, Monte ou Rio Bíblico', 'Damasco');
    });
    expect(harness.getState().canTriggerAdedonha).toBe(true);

    await act(async () => {
      await harness.getActions().handleTriggerAdedonha();
    });
    expect(harness.getState().room?.phase).toBe('tally');
    expect(harness.getState().currentTallyColumnName).toBe(
      'Personagem Bíblico'
    );

    const firstSub = harness.getState().currentColumnSubmissions[0];
    await act(async () => {
      await harness.getActions().handleRaiseDoubt(firstSub.id);
    });
    expect(
      harness
        .getState()
        .currentColumnSubmissions.find((s) => s.id === firstSub.id)?.doubtCount
    ).toBe(1);

    await act(async () => {
      await harness.getActions().handleJudgeSubmission(firstSub.id, 'unique');
    });
    expect(
      harness
        .getState()
        .currentColumnSubmissions.find((s) => s.id === firstSub.id)?.points
    ).toBe(10);

    await act(async () => {
      await harness.getActions().handleAdvanceTallyColumn();
    });
    expect(harness.getState().room?.currentTallyColumnIndex).toBe(1);

    await act(async () => {
      await harness.getActions().handleAdvanceTallyColumn();
      await harness.getActions().handleAdvanceTallyColumn();
    });
    expect(harness.getState().room?.phase).toBe('round_summary');

    await act(async () => {
      await harness.getActions().handleAdvanceToNextRound();
    });
    expect(harness.getState().room?.phase).toBe('lobby');
    expect(harness.getState().room?.currentRound).toBe(2);

    act(() => {
      harness.getActions().handleGoToScoreboard();
      harness.getActions().handleExitArena();
    });
    expect(mockPush).toHaveBeenCalledWith('/scoreboard');
    expect(mockPush).toHaveBeenCalledWith('/');

    harness.unmount();
  });

  it('deve converter DomainError em estado de erro legível na ViewModel', async () => {
    const useCases = new AdedonhaUseCases(new MemoryMultiplayerRoomService());
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      const ok = await harness.getActions().handleAddColumn('A');
      expect(ok).toBe(false);
    });
    expect(harness.getState().error).toBe(
      'O nome da coluna deve ter pelo menos 2 caracteres.'
    );

    await act(async () => {
      await harness.getActions().handleSpinRoulette('D');
    });

    await act(async () => {
      await harness.getActions().handleTriggerAdedonha();
    });
    expect(harness.getState().error).toContain('Preencha a coluna');

    await act(async () => {
      await harness.getActions().handleTimeOut();
    });
    expect(harness.getState().room?.phase).toBe('tally');

    await act(async () => {
      await harness.getActions().handleRetry();
    });
    expect(harness.getState().loading).toBe(false);

    harness.unmount();
  });

  it('deve tratar erro ao carregar a sala inicialmente', async () => {
    const failingUseCases: IAdedonhaUseCases = {
      getSuggestedColumns: () => [],
      getRoom: async () => {
        throw new ValidationError('Falha ao conectar à sala multiplayer.');
      },
      createRoom: async () => {
        throw new ValidationError('Erro');
      },
      joinRoom: async () => {
        throw new ValidationError('Erro');
      },
      addColumn: async () => {
        throw new ValidationError('Erro');
      },
      removeColumn: async () => {
        throw new ValidationError('Erro');
      },
      updateConfig: async () => {
        throw new ValidationError('Erro');
      },
      getAvailableLetters: () => [],
      spinRoulette: async () => {
        throw new ValidationError('Erro');
      },
      validateAnswerInitial: () => null,
      canTriggerStop: () => false,
      triggerAdedonha: async () => {
        throw new ValidationError('Erro');
      },
      finishRoundByTimeOut: async () => {
        throw new ValidationError('Erro');
      },
      raiseDoubt: async () => {
        throw new ValidationError('Erro');
      },
      judgeSubmission: async () => {
        throw new ValidationError('Erro');
      },
      advanceTallyColumn: async () => {
        throw new ValidationError('Erro');
      },
      advanceToNextRound: async () => {
        throw new ValidationError('Erro');
      },
      getAwards: () => ({
        generalChampion: null,
        fastestHand: null,
        rareVocabulary: null,
      }),
    };

    const harness = createHookHarness(failingUseCases);
    await harness.mount();

    expect(harness.getState().error).toBe(
      'Falha ao conectar à sala multiplayer.'
    );
    harness.unmount();
  });
});
