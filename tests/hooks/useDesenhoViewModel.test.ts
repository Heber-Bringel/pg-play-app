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
});
