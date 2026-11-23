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

    // Turno do Assassino (cd-player-2 ataca cd-player-4; cadência fixa até avanço do turno)
    const roomId = harness.getState().room!.id;
    await act(async () => {
      await useCases.submitAssassinTarget(roomId, 'cd-player-2', 'cd-player-4');
      await harness.getActions().handleAutoAdvanceNightTurn();
    });
    expect(harness.getState().room?.phase).toBe('night_angel');

    // Turno do Anjo (cd-player-3 protege a mesma vítima cd-player-4)
    await act(async () => {
      await useCases.submitAngelProtection(roomId, 'cd-player-3', 'cd-player-4');
      await harness.getActions().handleAutoAdvanceNightTurn();
    });
    expect(harness.getState().room?.phase).toBe('night_detective');

    // Turno do Detetive (Anfitrião cd-player-1 investiga Ana cd-player-2)
    act(() => {
      harness.getActions().handleSelectNightTarget('cd-player-2');
    });
    await act(async () => {
      await harness.getActions().handleConfirmDetectiveInvestigation();
    });
    expect(harness.getState().hasSubmittedNightAction).toBe(true);
    expect(harness.getState().room?.detectiveVerdict?.isAssassin).toBe(true);

    // Amanhecer
    await act(async () => {
      await harness.getActions().handleAdvanceToDawn();
    });
    expect(harness.getState().room?.phase).toBe('day_debate');
    expect(harness.getState().isNightPhase).toBe(false);
    expect(harness.getState().hasSubmittedNightAction).toBe(false);
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

  it('deve calcular secondsRemaining por phaseEndsAt e disparar autoAdvanceNightTurn no Anfitrião ao zerar (Issue #41)', async () => {
    const useCases = new CidadeDormeUseCases(
      new MemoryMultiplayerRoomService(),
      new MemoryNarratorAudioService(),
      undefined,
      () => Date.now()
    );
    const autoAdvanceSpy = jest.spyOn(useCases, 'autoAdvanceNightTurn');
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleCreateRoom('Héber');
    });
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
    await act(async () => {
      await harness.getActions().handleConfirmRoleReady(true);
    });

    expect(harness.getState().room?.phase).toBe('night_assassin');
    expect(harness.getState().secondsRemaining).toBe(15);

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });
    expect(harness.getState().secondsRemaining).toBe(10);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(autoAdvanceSpy).toHaveBeenCalledWith(
      harness.getState().room!.id,
      'night_assassin',
      1
    );
    expect(harness.getState().room?.phase).toBe('night_angel');
    expect(harness.getState().secondsRemaining).toBe(15);

    harness.unmount();
  });

  it('deve aplicar timeout de 10s em handleCreateRoom e handleJoinRoom liberando loading e expondo erro recuperável (Issue #43)', async () => {
    const baseUseCases = new CidadeDormeUseCases(
      new MemoryMultiplayerRoomService(),
      new MemoryNarratorAudioService()
    );
    const hangingUseCases: ICidadeDormeUseCases = {
      getLocalPlayerId: () => baseUseCases.getLocalPlayerId(),
      subscribeToRoom: (rid, cb) => baseUseCases.subscribeToRoom(rid, cb),
      getRoom: (rid) => baseUseCases.getRoom(rid),
      createRoom: () => new Promise(() => {}),
      joinRoom: () => new Promise(() => {}),
      leaveRoom: (rid, pid) => baseUseCases.leaveRoom(rid, pid),
      removePlayer: (rid, pid) => baseUseCases.removePlayer(rid, pid),
      updateConfig: (rid, cfg) => baseUseCases.updateConfig(rid, cfg),
      getRoleMetadata: (role) => baseUseCases.getRoleMetadata(role),
      startMatch: (rid, roles) => baseUseCases.startMatch(rid, roles),
      confirmPlayerReady: (rid, pid, all) =>
        baseUseCases.confirmPlayerReady(rid, pid, all),
      submitAssassinTarget: (rid, aid, tid) =>
        baseUseCases.submitAssassinTarget(rid, aid, tid),
      submitAngelProtection: (rid, aid, pid) =>
        baseUseCases.submitAngelProtection(rid, aid, pid),
      submitDetectiveInvestigation: (rid, aid, sid) =>
        baseUseCases.submitDetectiveInvestigation(rid, aid, sid),
      advanceToDawn: (rid) => baseUseCases.advanceToDawn(rid),
      autoAdvanceNightTurn: (rid, ep, er) =>
        baseUseCases.autoAdvanceNightTurn(rid, ep, er),
      startVotingPhase: (rid) => baseUseCases.startVotingPhase(rid),
      castVote: (rid, vid, cid) => baseUseCases.castVote(rid, vid, cid),
      tallyVotes: (rid) => baseUseCases.tallyVotes(rid),
      startNextNight: (rid) => baseUseCases.startNextNight(rid),
      restartMatch: (rid, roles) => baseUseCases.restartMatch(rid, roles),
      speakNarratorCaption: (cap, voice) =>
        baseUseCases.speakNarratorCaption(cap, voice),
      stopNarratorAudio: () => baseUseCases.stopNarratorAudio(),
    };

    const harness = createHookHarness(hangingUseCases);
    await harness.mount();

    let createResult: boolean | undefined;
    act(() => {
      void harness
        .getActions()
        .handleCreateRoom('Héber')
        .then((res) => {
          createResult = res;
        });
    });
    expect(harness.getState().loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(createResult).toBe(false);
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().error).toContain('Tempo limite de conexão excedido');

    let joinResult: boolean | undefined;
    act(() => {
      void harness
        .getActions()
        .handleJoinRoom('CD2026', 'Ana')
        .then((res) => {
          joinResult = res;
        });
    });
    expect(harness.getState().loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(10_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(joinResult).toBe(false);
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().error).toContain('Tempo limite de conexão excedido');

    harness.unmount();
  });

  it('deve expor phaseTimeline, aliveCount, eliminatedCount e handleSetReduceMotion (#56)', async () => {
    const useCases = new CidadeDormeUseCases(
      new MemoryMultiplayerRoomService(),
      new MemoryNarratorAudioService()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().reduceMotion).toBe(false);
    act(() => {
      harness.getActions().handleSetReduceMotion(true);
    });
    expect(harness.getState().reduceMotion).toBe(true);

    await act(async () => {
      await harness.getActions().handleCreateRoom('Héber');
    });
    const code = harness.getState().room!.code;
    if (harness.getState().room!.players.length < 5) {
      await act(async () => {
        await useCases.joinRoom(code, 'Pedro');
      });
    }

    const totalPlayers = harness.getState().room!.players.length;
    expect(harness.getState().aliveCount).toBe(totalPlayers);
    expect(harness.getState().eliminatedCount).toBe(0);

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
    await act(async () => {
      await harness.getActions().handleConfirmRoleReady(true);
    });

    expect(harness.getState().room?.phase).toBe('night_assassin');
    expect(harness.getState().phaseTimeline).toEqual([
      { id: 'night', label: 'Noite', isActive: true, isCompleted: false },
      { id: 'dawn', label: 'Amanhecer', isActive: false, isCompleted: false },
      { id: 'debate', label: 'Debate', isActive: false, isCompleted: false },
      { id: 'voting', label: 'Votação', isActive: false, isCompleted: false },
    ]);

    const detective = harness.getState().room!.players[0];
    const assassin = harness.getState().room!.players[1];
    const angel = harness.getState().room!.players[2];
    const citizen = harness.getState().room!.players[3];
    await act(async () => {
      const roomId = harness.getState().room!.id;
      await useCases.submitAssassinTarget(roomId, assassin.id, citizen.id);
      await useCases.autoAdvanceNightTurn(roomId, 'night_assassin', 1);
      await useCases.submitAngelProtection(roomId, angel.id, detective.id);
      await useCases.autoAdvanceNightTurn(roomId, 'night_angel', 1);
      await useCases.submitDetectiveInvestigation(roomId, detective.id, assassin.id);
      await useCases.advanceToDawn(roomId);
    });

    expect(harness.getState().room?.phase).toBe('day_debate');
    expect(harness.getState().aliveCount).toBe(totalPlayers - 1);
    expect(harness.getState().eliminatedCount).toBe(1);
    expect(harness.getState().phaseTimeline).toEqual([
      { id: 'night', label: 'Noite', isActive: false, isCompleted: true },
      { id: 'dawn', label: 'Amanhecer', isActive: false, isCompleted: true },
      { id: 'debate', label: 'Debate', isActive: true, isCompleted: false },
      { id: 'voting', label: 'Votação', isActive: false, isCompleted: false },
    ]);

    await act(async () => {
      await harness.getActions().handleStartVotingPhase();
    });
    expect(harness.getState().phaseTimeline[3]).toEqual({
      id: 'voting',
      label: 'Votação',
      isActive: true,
      isCompleted: false,
    });

    harness.unmount();
  });

  it('deve recuperar turno noturno do convidado em até 3s via getRoom quando subscribeToRoom omite evento e descartar versão menor (Issue #65)', async () => {
    const baseService = new MemoryMultiplayerRoomService();
    const baseUseCases = new CidadeDormeUseCases(
      baseService,
      new MemoryNarratorAudioService()
    );

    const created = await baseUseCases.createRoom('Anfitrião');
    const guestJoined = await baseUseCases.joinRoom(created.code, 'Ana');
    const guestId = guestJoined.players.find((p) => p.nickname === 'Ana')!.id;

    await baseUseCases.startMatch(created.id, [
      'detetive',
      'anjo',
      'assassino',
      'cidadao',
      'cidadao',
      'cidadao',
    ]);
    const nightAssassinRoom = await baseUseCases.confirmPlayerReady(
      created.id,
      created.hostId,
      true
    );

    let emitRoomUpdate: ((room: typeof nightAssassinRoom) => void) | null = null;
    let currentServerRoom = {
      ...nightAssassinRoom,
      phaseEndsAt: new Date(Date.now() + 1_000).toISOString(),
    };

    const mockUseCases: ICidadeDormeUseCases = {
      ...baseUseCases,
      getLocalPlayerId: async () => guestId,
      subscribeToRoom: (_rid, cb) => {
        emitRoomUpdate = cb;
        return () => {
          emitRoomUpdate = null;
        };
      },
      getRoom: jest.fn(async () => currentServerRoom),
      joinRoom: async () => currentServerRoom,
      createRoom: async () => currentServerRoom,
      leaveRoom: async () => {},
      removePlayer: async () => currentServerRoom,
      updateConfig: async () => currentServerRoom,
      getRoleMetadata: (role) => baseUseCases.getRoleMetadata(role),
      startMatch: async () => currentServerRoom,
      confirmPlayerReady: async () => currentServerRoom,
      submitAssassinTarget: async () => currentServerRoom,
      submitAngelProtection: async () => currentServerRoom,
      submitDetectiveInvestigation: async () => currentServerRoom,
      advanceToDawn: async () => currentServerRoom,
      autoAdvanceNightTurn: async () => currentServerRoom,
      startVotingPhase: async () => currentServerRoom,
      castVote: async () => currentServerRoom,
      tallyVotes: async () => currentServerRoom,
      startNextNight: async () => currentServerRoom,
      restartMatch: async () => currentServerRoom,
      speakNarratorCaption: async () => {},
      stopNarratorAudio: async () => {},
    };

    const guestHarness = createHookHarness(mockUseCases);
    await guestHarness.mount();

    await act(async () => {
      await guestHarness.getActions().handleJoinRoom(created.code, 'Ana');
    });
    expect(guestHarness.getState().isCurrentPlayerHost).toBe(false);
    expect(guestHarness.getState().room?.phase).toBe('night_assassin');

    // Servidor avança para night_angel com version maior, mas evento Realtime é perdido
    currentServerRoom = {
      ...currentServerRoom,
      phase: 'night_angel',
      version: currentServerRoom.version + 1,
      phaseEndsAt: new Date(Date.now() + 15_000).toISOString(),
    };

    // Avança 1s para phaseEndsAt expirar (secondsRemaining -> 0) e depois 1.5s para o watchdog disparar (<= 3s pós-phaseEndsAt)
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(guestHarness.getState().secondsRemaining).toBe(0);

    await act(async () => {
      jest.advanceTimersByTime(1_500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockUseCases.getRoom).toHaveBeenCalledWith(created.id);
    expect(guestHarness.getState().room?.phase).toBe('night_angel');
    expect(guestHarness.getState().room?.version).toBe(
      currentServerRoom.version
    );

    // Snapshot atrasado com version menor é descartado sem regredir a fase
    act(() => {
      emitRoomUpdate?.({
        ...nightAssassinRoom,
        phase: 'night_assassin',
        version: currentServerRoom.version - 1,
      });
    });
    expect(guestHarness.getState().room?.phase).toBe('night_angel');

    guestHarness.unmount();
  });

  it('deve expulsar imediatamente o jogador convidado do Lobby quando o Moderador o remove da sala', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new CidadeDormeUseCases(
      roomService,
      new MemoryNarratorAudioService()
    );
    const leaveSpy = jest.spyOn(useCases, 'leaveRoom');

    const hostHarness = createHookHarness(useCases);
    await hostHarness.mount();

    await act(async () => {
      await hostHarness.getActions().handleCreateRoom('Héber');
    });
    const code = hostHarness.getState().room!.code;

    const guestHarness = createHookHarness(useCases);
    await guestHarness.mount();
    await act(async () => {
      await guestHarness.getActions().handleJoinRoom(code, 'Carlos');
    });

    const carlos = guestHarness
      .getState()
      .room!.players.find((p) => p.nickname === 'Carlos')!;
    expect(guestHarness.getState().room?.phase).toBe('lobby');

    await act(async () => {
      await hostHarness.getActions().handleRemovePlayer(carlos.id);
    });

    expect(guestHarness.getState().room).toBeNull();
    expect(guestHarness.getState().currentPlayerId).toBeNull();
    expect(guestHarness.getState().error).toBe(
      'Você foi removido da sala pelo Moderador.'
    );
    expect(leaveSpy).toHaveBeenCalledWith(hostHarness.getState().room!.id, carlos.id);

    guestHarness.unmount();
    hostHarness.unmount();
  });

  it('deve gerenciar isNightCardRevealed com ocultação imediata no Assassino/Anjo e automática em 4s no Detetive (Issue #66)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new CidadeDormeUseCases(
      roomService,
      new MemoryNarratorAudioService()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleCreateRoom('Héber');
    });
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
    await act(async () => {
      await harness.getActions().handleConfirmRoleReady(true);
    });

    expect(harness.getState().room?.phase).toBe('night_assassin');
    expect(harness.getState().isNightCardRevealed).toBe(false);

    // Abre manualmente e fecha manualmente
    act(() => {
      harness.getActions().handleToggleNightCardVisibility();
    });
    expect(harness.getState().isNightCardRevealed).toBe(true);

    act(() => {
      harness.getActions().handleHideNightCard();
    });
    expect(harness.getState().isNightCardRevealed).toBe(false);

    // Ao trocar de turno para night_angel e depois night_detective, mantém oculto e auto-oculta veredito após 4s
    const roomId = harness.getState().room!.id;
    await act(async () => {
      await useCases.autoAdvanceNightTurn(roomId, 'night_assassin', 1);
    });
    expect(harness.getState().room?.phase).toBe('night_angel');
    expect(harness.getState().isNightCardRevealed).toBe(false);

    await act(async () => {
      await useCases.autoAdvanceNightTurn(roomId, 'night_angel', 1);
    });
    expect(harness.getState().room?.phase).toBe('night_detective');

    act(() => {
      harness.getActions().handleToggleNightCardVisibility();
      harness.getActions().handleSelectNightTarget('cd-player-2');
    });
    expect(harness.getState().isNightCardRevealed).toBe(true);

    await act(async () => {
      await harness.getActions().handleConfirmDetectiveInvestigation();
    });
    expect(harness.getState().room?.detectiveVerdict?.isAssassin).toBe(true);
    expect(harness.getState().isNightCardRevealed).toBe(true);

    act(() => {
      jest.advanceTimersByTime(4_000);
    });
    expect(harness.getState().isNightCardRevealed).toBe(false);

    // Simula hook como Assassino para verificar ocultação imediata pós-confirmação
    const assassinRoomService = new MemoryMultiplayerRoomService();
    const assassinUseCases = new CidadeDormeUseCases(
      assassinRoomService,
      new MemoryNarratorAudioService()
    );
    const assassinHarness = createHookHarness(assassinUseCases);
    await assassinHarness.mount();
    await act(async () => {
      await assassinHarness.getActions().handleCreateRoom('AssassinoHost');
    });
    await act(async () => {
      await assassinHarness
        .getActions()
        .handleStartMatch([
          'assassino',
          'anjo',
          'detetive',
          'cidadao',
          'cidadao',
          'cidadao',
        ]);
    });
    await act(async () => {
      await assassinHarness.getActions().handleConfirmRoleReady(true);
    });

    act(() => {
      assassinHarness.getActions().handleToggleNightCardVisibility();
      assassinHarness.getActions().handleSelectNightTarget('cd-player-4');
    });
    expect(assassinHarness.getState().isNightCardRevealed).toBe(true);

    await act(async () => {
      await assassinHarness.getActions().handleConfirmAssassinTarget();
    });
    expect(assassinHarness.getState().isNightCardRevealed).toBe(false);

    assassinHarness.unmount();
    harness.unmount();
  });
});
