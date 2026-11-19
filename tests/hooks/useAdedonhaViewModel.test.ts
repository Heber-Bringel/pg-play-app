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
import { mockPush, mockReplace } from '../__mocks__/expo-router';

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
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve iniciar na etapa de identificação e permitir criar ou entrar em sala (RF-01, RF-02)', async () => {
    const service = new MemoryMultiplayerRoomService();
    const useCases = new AdedonhaUseCases(service);
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().room).toBeNull();

    await act(async () => {
      const ok = await harness.getActions().handleCreateRoom('Heber');
      expect(ok).toBe(true);
    });

    expect(harness.getState().room?.phase).toBe('lobby');
    expect(harness.getState().isCurrentPlayerHost).toBe(true);
    expect(harness.getState().currentPlayerId).toBe('player-host');

    const createdCode = harness.getState().room!.code;

    const guestHarness = createHookHarness(useCases);
    await guestHarness.mount();
    await act(async () => {
      const joined = await guestHarness
        .getActions()
        .handleJoinRoom(createdCode, 'Rebeca');
      expect(joined).toBe(true);
    });

    expect(guestHarness.getState().isCurrentPlayerHost).toBe(false);
    expect(
      guestHarness
        .getState()
        .room?.players.some((p) => p.nickname === 'Rebeca')
    ).toBe(true);

    // Sincronização em tempo real: quando o host adiciona uma coluna, o convidado recebe automaticamente
    await act(async () => {
      await harness.getActions().handleAddColumn('Milagre ou Parábola');
    });
    expect(guestHarness.getState().room?.config.columns).toContain(
      'Milagre ou Parábola'
    );

    guestHarness.unmount();
    harness.unmount();
  });

  it('deve carregar a sala demo, adicionar/remover colunas e girar a Roleta Expressiva (RF21)', async () => {
    const useCases = new AdedonhaUseCases(new MemoryMultiplayerRoomService());
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      const ok = await harness.getActions().handleJoinDemoRoom();
      expect(ok).toBe(true);
    });

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
      await harness.getActions().handleJoinDemoRoom();
    });

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
    expect(harness.getState().room?.phase).toBe('stop_countdown');
    expect(harness.getState().secondsRemaining).toBe(5);

    await act(async () => {
      await harness.getActions().handleFinalizeStopNow();
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
      harness.getActions().handleRequestExit();
    });
    expect(harness.getState().confirmingExit).toBe(true);
    act(() => {
      harness.getActions().handleCancelExit();
    });
    expect(harness.getState().confirmingExit).toBe(false);

    act(() => {
      harness.getActions().handleGoToScoreboard();
      harness.getActions().handleRequestExit();
      harness.getActions().handleExitArena();
    });
    expect(harness.getState().confirmingExit).toBe(false);
    expect(harness.getState().room).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/scoreboard');
    expect(mockReplace).toHaveBeenCalledWith('/');

    harness.unmount();
  });

  it('deve converter DomainError em estado de erro legível na ViewModel', async () => {
    const useCases = new AdedonhaUseCases(new MemoryMultiplayerRoomService());
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleJoinDemoRoom();
    });

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

  it('deve tratar erro ao tentar criar ou entrar em sala', async () => {
    const failingUseCases: IAdedonhaUseCases = {
      getSuggestedColumns: () => [],
      getLocalPlayerId: async () => null,
      subscribeToRoom: () => () => {},
      getRoom: async () => {
        throw new ValidationError('Falha ao conectar à sala multiplayer.');
      },
      createRoom: async () => {
        throw new ValidationError('Apelido inválido para criar sala.');
      },
      joinRoom: async () => {
        throw new ValidationError('Código PIN inválido.');
      },
      leaveRoom: async () => {},
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
      submitAnswers: async () => {
        throw new ValidationError('Erro');
      },
      startStopCountdown: async () => {
        throw new ValidationError('Erro');
      },
      finalizeStopCountdown: async () => {
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

    await act(async () => {
      const ok = await harness.getActions().handleCreateRoom('');
      expect(ok).toBe(false);
    });
    expect(harness.getState().error).toBe('Apelido inválido para criar sala.');

    await act(async () => {
      const ok = await harness.getActions().handleJoinRoom('12', 'Ana');
      expect(ok).toBe(false);
    });
    expect(harness.getState().error).toBe('Código PIN inválido.');

    await act(async () => {
      const ok = await harness.getActions().handleJoinDemoRoom();
      expect(ok).toBe(false);
    });
    expect(harness.getState().error).toBe(
      'Falha ao conectar à sala multiplayer.'
    );
    harness.unmount();
  });
});
