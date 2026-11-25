import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { DesenhoUseCases } from '@/usecase/desenhoUseCases';
import type { IDesenhoUseCases } from '@/usecase/iDesenhoUseCases';
import {
  DESENHO_THEME_INITIAL_SECONDS,
  DESENHO_THEME_PEEK_SECONDS,
  useDesenhoViewModel,
  type DesenhoActions,
  type DesenhoState,
} from '@/viewmodel/useDesenhoViewModel';
import { mockReplace } from '../__mocks__/expo-router';

function createHookHarness(useCases: IDesenhoUseCases) {
  let latestState!: DesenhoState;
  let latestActions!: DesenhoActions;

  const Host = () => {
    const [state, actions] = useDesenhoViewModel(useCases);
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

describe('useDesenhoViewModel — Sala Multiplayer, Tema 5s, Espiar 3s e Formas (UC12)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve exibir o tema por 5s no início do turno, sumir automaticamente expandindo o canvas e permitir espiar por 3s (RF42)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new DesenhoUseCases(
      roomService,
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleJoinDemoRoom();
    });
    expect(harness.getState().room?.phase).toBe('lobby');
    expect(harness.getState().isCurrentPlayerHost).toBe(true);

    await act(async () => {
      await harness.getActions().handleStartMatch();
    });

    // No início do turno, o desenhista vê o tema por 5 segundos
    expect(harness.getState().room?.phase).toBe('drawing');
    expect(harness.getState().isCurrentPlayerDrawer).toBe(true);
    expect(harness.getState().isThemeBannerVisible).toBe(true);
    expect(harness.getState().themeBannerSecondsLeft).toBe(
      DESENHO_THEME_INITIAL_SECONDS
    );
    expect(harness.getState().isCanvasExpanded).toBe(false);

    // Após 5 segundos, o tema desaparece e o canvas expande ocupando a área do tema
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(harness.getState().isThemeBannerVisible).toBe(false);
    expect(harness.getState().themeBannerSecondsLeft).toBe(0);
    expect(harness.getState().isCanvasExpanded).toBe(true);

    // Ao tocar em Espiar palavra, reexibe por 3 segundos mantendo canvas expandido
    act(() => {
      harness.getActions().handlePeekWord();
    });
    expect(harness.getState().isThemeBannerVisible).toBe(true);
    expect(harness.getState().isPeekingTheme).toBe(true);
    expect(harness.getState().themeBannerSecondsLeft).toBe(
      DESENHO_THEME_PEEK_SECONDS
    );
    expect(harness.getState().isCanvasExpanded).toBe(true);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(harness.getState().isThemeBannerVisible).toBe(false);
    expect(harness.getState().isPeekingTheme).toBe(false);
    expect(harness.getState().isCanvasExpanded).toBe(true);

    harness.unmount();
  });

  it('deve selecionar ferramentas/formas/preenchimento, sincronizar elementos, desfazer e limpar (RF41)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new DesenhoUseCases(
      roomService,
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleJoinDemoRoom();
    });
    await act(async () => {
      await harness.getActions().handleStartMatch();
    });

    act(() => {
      harness.getActions().handleSelectTool('rectangle');
      harness.getActions().handleSelectFillMode('fill');
      harness.getActions().handleSelectColor('purple');
      harness.getActions().handleSelectWidth('thick');
    });

    expect(harness.getState().selectedTool).toBe('rectangle');
    expect(harness.getState().selectedFillMode).toBe('fill');
    expect(harness.getState().selectedColor).toBe('purple');
    expect(harness.getState().selectedWidth).toBe('thick');

    await act(async () => {
      await harness.getActions().handleCompleteElement({
        tool: 'rectangle',
        start: { x: 10, y: 10 },
        end: { x: 90, y: 80 },
        fillMode: 'fill',
        colorId: 'purple',
        widthId: 'thick',
      });
    });
    expect(harness.getState().room?.elements).toHaveLength(1);

    await act(async () => {
      await harness.getActions().handleUndoElement();
    });
    expect(harness.getState().room?.elements).toHaveLength(0);

    await act(async () => {
      await harness.getActions().handleCompleteElement({
        tool: 'triangle',
        start: { x: 10, y: 10 },
        end: { x: 100, y: 100 },
        fillMode: 'stroke',
        colorId: 'coral',
        widthId: 'thin',
      });
    });
    expect(harness.getState().room?.elements).toHaveLength(1);

    await act(async () => {
      await harness.getActions().handleClearCanvas();
    });
    expect(harness.getState().room?.elements).toHaveLength(0);

    harness.unmount();
  });

  it('deve criar sala, configurar parâmetros, bloquear última categoria e confirmar saída segura (RF11, RF44)', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new DesenhoUseCases(
      roomService,
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      const ok = await harness.getActions().handleCreateRoom('Roger');
      expect(ok).toBe(true);
    });

    await act(async () => {
      await harness.getActions().handleSelectDuration(120);
      await harness.getActions().handleSelectRounds(3);
    });
    expect(harness.getState().room?.config.turnDurationSeconds).toBe(120);
    expect(harness.getState().room?.config.totalRounds).toBe(3);

    // Desmarca 4 de 5 pacotes e tenta remover o último
    for (const category of [
      'Animais',
      'Objetos',
      'Comidas',
      'Lugares e Natureza',
    ] as const) {
      await act(async () => {
        await harness.getActions().handleToggleCategory(category);
      });
    }
    expect(harness.getState().room?.config.categories).toEqual(['Bíblico']);

    await act(async () => {
      await harness.getActions().handleToggleCategory('Bíblico');
    });
    expect(harness.getState().categoryWarning).toBeTruthy();
    expect(harness.getState().room?.config.categories).toEqual(['Bíblico']);

    act(() => {
      harness.getActions().handleRequestExit();
    });
    expect(harness.getState().confirmingExit).toBe(true);

    await act(async () => {
      await harness.getActions().handleConfirmExit();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    harness.unmount();
  });

  it('deve aplicar atualização otimista imediata ao concluir traço, preservar traços concorrentes e fazer rollback se falhar', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const realUseCases = new DesenhoUseCases(
      roomService,
      new MemoryGameCatalogDataSource()
    );

    let resolveFirst!: (room: Awaited<ReturnType<IDesenhoUseCases['addElement']>>) => void;
    let rejectSecond!: (err: Error) => void;
    let callCount = 0;

    const controlledUseCases: IDesenhoUseCases = {
      getLocalPlayerId: (id) => realUseCases.getLocalPlayerId(id),
      getRoom: (id, viewer) => realUseCases.getRoom(id, viewer),
      createRoom: (nick, cats) => realUseCases.createRoom(nick, cats),
      joinRoom: (code, nick) => realUseCases.joinRoom(code, nick),
      leaveRoom: (id, pid) => realUseCases.leaveRoom(id, pid),
      subscribeToRoom: (id, cb) => realUseCases.subscribeToRoom(id, cb),
      updateConfig: (id, cfg) => realUseCases.updateConfig(id, cfg),
      startMatch: (id) => realUseCases.startMatch(id),
      addElement: (roomId, drawerId, draft) => {
        callCount += 1;
        if (callCount === 1) {
          return new Promise((resolve) => {
            resolveFirst = resolve;
          });
        }
        return new Promise((_resolve, reject) => {
          rejectSecond = reject;
        });
      },
      undoElement: (id, drawer) => realUseCases.undoElement(id, drawer),
      clearCanvas: (id, drawer) => realUseCases.clearCanvas(id, drawer),
      submitGuess: (id, pid, txt) => realUseCases.submitGuess(id, pid, txt),
      finishTurn: (id, reason) => realUseCases.finishTurn(id, reason),
      advanceTurn: (id) => realUseCases.advanceTurn(id),
      restartLobby: (id) => realUseCases.restartLobby(id),
      getRankedPlayers: (r) => realUseCases.getRankedPlayers(r),
      getAwards: (r) => realUseCases.getAwards(r),
    };

    const harness = createHookHarness(controlledUseCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleJoinDemoRoom();
    });
    await act(async () => {
      await harness.getActions().handleStartMatch();
    });

    const stroke1 = {
      tool: 'freehand' as const,
      points: [
        { x: 10, y: 10 },
        { x: 40, y: 40 },
      ],
      colorId: 'ink' as const,
      widthId: 'thin' as const,
    };
    const stroke2 = {
      tool: 'line' as const,
      start: { x: 20, y: 20 },
      end: { x: 80, y: 80 },
      fillMode: 'stroke' as const,
      colorId: 'purple' as const,
      widthId: 'thick' as const,
    };

    // Dispara 2 traços em sequência antes de qualquer resposta remota
    let p1!: Promise<void>;
    let p2!: Promise<void>;
    act(() => {
      p1 = harness.getActions().handleCompleteElement(stroke1);
      p2 = harness.getActions().handleCompleteElement(stroke2);
    });

    // Ambos já aparecem imediatamente via atualização otimista
    expect(harness.getState().room?.elements).toHaveLength(2);

    // 1º traço confirma no servidor; o 2º ainda pendente deve ser preservado
    const persisted1 = await realUseCases.addElement(
      harness.getState().room!.id,
      harness.getState().currentPlayerId!,
      stroke1
    );
    await act(async () => {
      resolveFirst(persisted1);
      await p1;
    });
    expect(harness.getState().room?.elements).toHaveLength(2);

    // 2º traço falha no servidor -> rollback apenas do 2º elemento otimista
    await act(async () => {
      rejectSecond(new Error('Falha de rede simulada'));
      await p2;
    });
    expect(harness.getState().room?.elements).toHaveLength(1);
    expect(harness.getState().error).toBe('Não foi possível sincronizar o desenho.');

    harness.unmount();
  });

  it('não deve reiniciar o cronômetro de 1s quando novos traços são adicionados', async () => {
    const roomService = new MemoryMultiplayerRoomService();
    const useCases = new DesenhoUseCases(
      roomService,
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleJoinDemoRoom();
    });
    await act(async () => {
      await harness.getActions().handleStartMatch();
    });

    const initialSeconds = harness.getState().secondsRemaining;

    // Avança 500ms, conclui um traço, avança mais 500ms (total 1000ms) -> deve ter decrementado 1s!
    act(() => {
      jest.advanceTimersByTime(500);
    });
    await act(async () => {
      await harness.getActions().handleCompleteElement({
        tool: 'freehand',
        points: [
          { x: 10, y: 10 },
          { x: 30, y: 30 },
        ],
        colorId: 'ink',
        widthId: 'thin',
      });
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(harness.getState().secondsRemaining).toBe(initialSeconds - 1);

    harness.unmount();
  });
});
