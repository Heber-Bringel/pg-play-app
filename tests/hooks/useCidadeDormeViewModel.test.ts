import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { MemoryNarratorAudioService } from '@/infra/services/memoryNarratorAudioService';
import { ValidationError } from '@/model/errors';
import { CidadeDormeUseCases } from '@/usecase/cidadeDormeUseCases';
import type { ICidadeDormeUseCases } from '@/usecase/iCidadeDormeUseCases';
import {
  useCidadeDormeViewModel,
  type CidadeDormeActions,
  type CidadeDormeState,
} from '@/viewmodel/useCidadeDormeViewModel';
import { mockReplace } from '../__mocks__/expo-router';

function createHookHarness(useCases: ICidadeDormeUseCases) {
  let latestState!: CidadeDormeState;
  let latestActions!: CidadeDormeActions;

  const Host = () => {
    const [state, actions] = useCidadeDormeViewModel(useCases);
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

describe('useCidadeDormeViewModel — Hook do Cidade Dorme em Sala Multiplayer (UC07)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve iniciar na etapa de identificação e permitir criar ou entrar em sala com sincronização Realtime (RNF03)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const narratorService = new MemoryNarratorAudioService();
    const useCases = new CidadeDormeUseCases(roomService, narratorService);
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().room).toBeNull();

    await act(async () => {
      const ok = await harness.getActions().handleCreateRoom('Héber');
      expect(ok).toBe(true);
    });

    expect(harness.getState().room?.phase).toBe('lobby');
    expect(harness.getState().isCurrentPlayerHost).toBe(true);
    expect(harness.getState().currentPlayer?.nickname).toBe('Héber');

    const createdCode = harness.getState().room!.code;

    const guestHarness = createHookHarness(useCases);
    await guestHarness.mount();
    await act(async () => {
      const joined = await guestHarness
        .getActions()
        .handleJoinRoom(createdCode, 'Mikaelle');
      expect(joined).toBe(true);
    });

    expect(guestHarness.getState().isCurrentPlayerHost).toBe(false);
    expect(
      guestHarness
        .getState()
        .room?.players.some((p) => p.nickname === 'Mikaelle')
    ).toBe(true);

    // Sincronização automática via subscribeToRoom
    await act(async () => {
      await harness
        .getActions()
        .handleUpdateConfig({ narratorVoice: 'feminina' });
    });
    expect(guestHarness.getState().room?.config.narratorVoice).toBe('feminina');

    guestHarness.unmount();
    harness.unmount();
  });

  it('deve conduzir o fluxo completo: Lobby -> Revelação de Papel -> A Noite (Assassino, Anjo, Detetive) -> O Dia -> Votação -> Vitória e Revanche (RF18–RF20)', async () => {
    const useCases = new CidadeDormeUseCases(
      new MemoryMultiplayerRoomService(),
      new MemoryNarratorAudioService()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      const ok = await harness.getActions().handleCreateRoom('Líder do PG');
      expect(ok).toBe(true);
    });

    expect(harness.getState().room?.phase).toBe('lobby');

    // Remover um participante convidado no Lobby após entrada via PIN
    const roomCode = harness.getState().room!.code;
    await act(async () => {
      await useCases.joinRoom(roomCode, 'Douglas');
    });
    const douglas = harness
      .getState()
      .room!.players.find((p) => p.nickname === 'Douglas')!;
    await act(async () => {
      await harness.getActions().handleRemovePlayer(douglas.id);
    });

    // Distribuir papéis e iniciar Fase 0
    await act(async () => {
      await harness
        .getActions()
        .handleStartMatch([
          'detetive',
          'assassino',
          'anjo',
          'cidadao',
          'cidadao',
          'cidadao',
        ]);
    });
    expect(harness.getState().room?.phase).toBe('role_reveal');
    expect(harness.getState().currentRoleMeta?.role).toBe('detetive');
    expect(harness.getState().isRoleVisible).toBe(false);

    // Revelar e depois esconder papel confirmando início da noite
    act(() => {
      harness.getActions().handleToggleRoleVisibility();
    });
    expect(harness.getState().isRoleVisible).toBe(true);

    await act(async () => {
      await harness.getActions().handleConfirmRoleReady(true);
    });
    expect(harness.getState().isRoleVisible).toBe(false);
    expect(harness.getState().room?.phase).toBe('night_assassin');
    expect(harness.getState().isNightPhase).toBe(true);

    // Turno do Assassino
    act(() => {
      harness.getActions().handleSelectNightTarget('cd-player-4');
    });
    await act(async () => {
      await harness.getActions().handleConfirmAssassinTarget();
    });
    expect(harness.getState().room?.phase).toBe('night_angel');

    // Turno do Anjo (protege a mesma vítima cd-player-4)
    act(() => {
      harness.getActions().handleSelectNightTarget('cd-player-4');
    });
    await act(async () => {
      await harness.getActions().handleConfirmAngelProtection();
    });
    expect(harness.getState().room?.phase).toBe('night_detective');

    // Turno do Detetive (investiga Ana cd-player-2)
    act(() => {
      harness.getActions().handleSelectNightTarget('cd-player-2');
    });
    await act(async () => {
      await harness.getActions().handleConfirmDetectiveInvestigation();
    });
    expect(harness.getState().room?.detectiveVerdict?.isAssassin).toBe(true);

    // Amanhecer
    await act(async () => {
      await harness.getActions().handleAdvanceToDawn();
    });
    expect(harness.getState().room?.phase).toBe('day_debate');
    expect(harness.getState().isNightPhase).toBe(false);
    expect(harness.getState().room?.dawnReport?.savedByAngel).toBe(true);

    // Iniciar votação secreta
    await act(async () => {
      await harness.getActions().handleStartVotingPhase();
    });
    expect(harness.getState().room?.phase).toBe('day_voting');

    // Votar em Pular Voto para testar empate/abstenção e próxima noite
    act(() => {
      harness.getActions().handleSelectVoteTarget('skip');
    });
    await act(async () => {
      await harness.getActions().handleCastVote();
      await harness.getActions().handleTallyVotes();
    });
    expect(harness.getState().room?.phase).toBe('vote_result');
    expect(harness.getState().room?.voteReport?.tieOrSkipped).toBe(true);

    // Iniciar Noite 2 e usar avanço automático nos 3 turnos
    await act(async () => {
      await harness.getActions().handleStartNextNight();
    });
    expect(harness.getState().room?.phase).toBe('night_assassin');

    await act(async () => {
      await harness.getActions().handleAutoAdvanceNightTurn();
      await harness.getActions().handleAutoAdvanceNightTurn();
      await harness.getActions().handleAutoAdvanceNightTurn();
    });
    expect(harness.getState().room?.phase).toBe('day_debate');

    // Iniciar votação e eliminar a Assassina Ana (cd-player-2)
    await act(async () => {
      await harness.getActions().handleStartVotingPhase();
    });
    act(() => {
      harness.getActions().handleSelectVoteTarget('cd-player-2');
    });
    await act(async () => {
      await harness.getActions().handleTallyVotes();
    });
    expect(harness.getState().room?.phase).toBe('finished');
    expect(harness.getState().room?.winner).toBe('cidade');

    // Revanche na mesma sala
    await act(async () => {
      await harness.getActions().handleRestartMatch();
    });
    expect(harness.getState().room?.phase).toBe('role_reveal');

    // Fluxo de saída segura
    act(() => {
      harness.getActions().handleRequestExit();
    });
    expect(harness.getState().confirmingExit).toBe(true);
    act(() => {
      harness.getActions().handleCancelExit();
    });
    expect(harness.getState().confirmingExit).toBe(false);
    act(() => {
      harness.getActions().handleExitArena();
    });
    expect(harness.getState().room).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/');

    harness.unmount();
  });

  it('deve converter DomainError em estado de erro legível na ViewModel', async () => {
    const useCases = new CidadeDormeUseCases(
      new MemoryMultiplayerRoomService(),
      new MemoryNarratorAudioService()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      const ok = await harness.getActions().handleCreateRoom('X');
      expect(ok).toBe(false);
    });
    expect(harness.getState().error).toBe(
      'Digite um apelido com pelo menos 2 letras para o Moderador.'
    );

    await act(async () => {
      await harness.getActions().handleCreateRoom('Héber');
    });

    await act(async () => {
      await harness.getActions().handleRemovePlayer(harness.getState().room!.hostId);
    });
    expect(harness.getState().error).toBe(
      'O Moderador anfitrião não pode ser removido da sala.'
    );

    await act(async () => {
      await harness.getActions().handleRetry();
    });
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().error).toBeNull();

    // Testar falha de conexão simulada
    const failingUseCases: ICidadeDormeUseCases = {
      getLocalPlayerId: async () => null,
      subscribeToRoom: () => () => {},
      getRoom: async () => {
        throw new ValidationError('Falha ao carregar sala do Cidade Dorme.');
      },
      createRoom: async () => {
        throw new ValidationError('Erro ao criar sala.');
      },
      joinRoom: async () => {
        throw new ValidationError('PIN inválido.');
      },
      leaveRoom: async () => {},
      removePlayer: async () => {
        throw new ValidationError('Erro');
      },
      updateConfig: async () => {
        throw new ValidationError('Erro');
      },
      getRoleMetadata: (role) => useCases.getRoleMetadata(role),
      startMatch: async () => {
        throw new ValidationError('Erro');
      },
      confirmPlayerReady: async () => {
        throw new ValidationError('Erro');
      },
      submitAssassinTarget: async () => {
        throw new ValidationError('Erro');
      },
      submitAngelProtection: async () => {
        throw new ValidationError('Erro');
      },
      submitDetectiveInvestigation: async () => {
        throw new ValidationError('Erro');
      },
      advanceToDawn: async () => {
        throw new ValidationError('Erro');
      },
      autoAdvanceNightTurn: async () => {
        throw new ValidationError('Erro');
      },
      startVotingPhase: async () => {
        throw new ValidationError('Erro');
      },
      castVote: async () => {
        throw new ValidationError('Erro');
      },
      tallyVotes: async () => {
        throw new ValidationError('Erro');
      },
      startNextNight: async () => {
        throw new ValidationError('Erro');
      },
      restartMatch: async () => {
        throw new ValidationError('Erro');
      },
      speakNarratorCaption: async () => {},
      stopNarratorAudio: async () => {},
    };

    const failHarness = createHookHarness(failingUseCases);
    await failHarness.mount();
    await act(async () => {
      const ok = await failHarness.getActions().handleJoinRoom('CD2026', 'Ana');
      expect(ok).toBe(false);
    });
    expect(failHarness.getState().error).toBe('PIN inválido.');

    failHarness.unmount();
    harness.unmount();
  });

  it('deve reproduzir áudio do Narrador apenas no dispositivo do Anfitrião e parar ao sair', async () => {
    const hostRoomService = new MemoryMultiplayerRoomService();
    const hostNarratorService = new MemoryNarratorAudioService();
    const hostUseCases = new CidadeDormeUseCases(
      hostRoomService,
      hostNarratorService
    );
    const hostSpeakSpy = jest.spyOn(hostUseCases, 'speakNarratorCaption');
    const hostStopSpy = jest.spyOn(hostUseCases, 'stopNarratorAudio');

    const hostHarness = createHookHarness(hostUseCases);
    await hostHarness.mount();

    await act(async () => {
      await hostHarness.getActions().handleCreateRoom('Héber');
    });
    expect(hostSpeakSpy).not.toHaveBeenCalled();

    await act(async () => {
      await hostHarness.getActions().handleStartMatch([
        'detetive',
        'assassino',
        'anjo',
        'cidadao',
        'cidadao',
        'cidadao',
      ]);
    });
    expect(hostSpeakSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await hostHarness.getActions().handleConfirmRoleReady(true);
    });
    expect(hostSpeakSpy).toHaveBeenCalledTimes(2);

    act(() => {
      hostHarness.getActions().handleExitArena();
    });
    expect(hostStopSpy).toHaveBeenCalled();
    hostHarness.unmount();

    // Dispositivo de convidado não deve disparar speakNarratorCaption em atualizações Realtime
    const guestRoomService = new MemoryMultiplayerRoomService();
    const guestNarratorService = new MemoryNarratorAudioService();
    const guestUseCases = new CidadeDormeUseCases(
      guestRoomService,
      guestNarratorService
    );
    const guestSpeakSpy = jest.spyOn(guestUseCases, 'speakNarratorCaption');
    const guestHarness = createHookHarness(guestUseCases);
    await guestHarness.mount();

    await act(async () => {
      await guestHarness.getActions().handleJoinRoom('CD2026', 'Mikaelle');
    });
    expect(guestHarness.getState().isCurrentPlayerHost).toBe(false);

    const joinedRoomId = guestHarness.getState().room!.id;
    await act(async () => {
      await guestUseCases.startMatch(joinedRoomId);
    });

    expect(guestHarness.getState().room?.phase).toBe('role_reveal');
    expect(guestSpeakSpy).not.toHaveBeenCalled();

    guestHarness.unmount();
  });
});
