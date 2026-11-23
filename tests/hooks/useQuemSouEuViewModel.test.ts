import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryQuemSouEuDataSource } from '@/infra/datasources/memoryQuemSouEuDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryScreenOrientationService } from '@/infra/services/memoryScreenOrientationService';
import { MemoryTiltSensorService } from '@/infra/services/memoryTiltSensorService';
import type { QuemSouEuCard } from '@/model/entities/quemSouEuCard';
import { QuemSouEuUseCases } from '@/usecase/quemSouEuUseCases';
import { useQuemSouEuViewModel } from '@/viewmodel/useQuemSouEuViewModel';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    dismissTo: mockDismissTo,
    back: jest.fn(),
  }),
}));

function renderQuemSouEuHook(useCase: QuemSouEuUseCases) {
  let latestState!: ReturnType<typeof useQuemSouEuViewModel>[0];
  let latestActions!: ReturnType<typeof useQuemSouEuViewModel>[1];

  const Host = () => {
    const [state, actions] = useQuemSouEuViewModel(useCase);
    latestState = state;
    latestActions = actions;
    return null;
  };

  let tree!: renderer.ReactTestRenderer;

  return {
    get state() {
      return latestState;
    },
    get actions() {
      return latestActions;
    },
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
  };
}

describe('useQuemSouEuViewModel', () => {
  let fakeNow = 10000;

  beforeEach(() => {
    jest.useFakeTimers();
    fakeNow = 10000;
    mockPush.mockClear();
    mockReplace.mockClear();
    mockDismissTo.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildUseCase = (customCards?: QuemSouEuCard[]) => {
    const teamDs = new MemoryTeamDataSource([
      { id: 't1', name: 'Alfa', score: 0 },
      { id: 't2', name: 'Beta', score: 0 },
    ]);
    const cardDs = new MemoryQuemSouEuDataSource(customCards);
    const tiltService = new MemoryTiltSensorService(true, () => fakeNow);
    const orientationService = new MemoryScreenOrientationService();
    const useCase = new QuemSouEuUseCases(
      cardDs,
      teamDs,
      tiltService,
      orientationService
    );
    return { useCase, teamDs, tiltService, orientationService };
  };

  it('conduz fluxo completo de setup -> handoff -> countdown -> playing -> summary -> finished e envia pontos ao placar', async () => {
    const { useCase, teamDs, tiltService, orientationService } = buildUseCase();
    const hook = renderQuemSouEuHook(useCase);
    await hook.mount();

    expect(hook.state.loading).toBe(false);
    expect(hook.state.phase).toBe('setup');
    expect(hook.state.teams).toHaveLength(2);
    expect(orientationService.getCurrentMode()).toBe('unlocked');

    act(() => {
      hook.actions.selectDuration(45);
      hook.actions.selectRoundsPerTeam(1);
    });

    await act(async () => {
      await hook.actions.startMatch();
    });

    expect(hook.state.phase).toBe('handoff');
    expect(hook.state.currentTeam?.name).toBe('Alfa');
    expect(orientationService.getCurrentMode()).toBe('landscape');

    // Inicia turno -> contagem de 3 segundos
    act(() => {
      hook.actions.startTurn();
    });
    expect(hook.state.phase).toBe('countdown');
    expect(hook.state.countdownSeconds).toBe(3);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(hook.state.phase).toBe('playing');
    expect(hook.state.secondsRemaining).toBe(45);

    const firstCard = hook.state.currentCard!;

    // Inclinar para baixo -> acerto (+10 pts)
    act(() => {
      tiltService.emitGesture('hit');
    });
    expect(hook.state.turnPoints).toBe(10);
    expect(hook.state.turnResults).toHaveLength(1);
    expect(hook.state.turnResults[0].card.id).toBe(firstCard.id);
    expect(hook.state.turnResults[0].outcome).toBe('hit');
    expect(hook.state.lastFeedback?.outcome).toBe('hit');

    // Aguarda o feedback (1 s) antes de trocar para a próxima carta
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Inclinar para cima após cooldown -> passe (0 pts)
    fakeNow += 1200;
    act(() => {
      tiltService.emitGesture('pass');
    });
    expect(hook.state.turnPoints).toBe(10);
    expect(hook.state.turnResults).toHaveLength(2);
    expect(hook.state.turnResults[1].outcome).toBe('pass');
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Zerar o cronômetro -> descarta a carta atual sem pontuar e vai para resumo
    const cardAtTimeout = hook.state.currentCard!;
    act(() => {
      jest.advanceTimersByTime(45000);
    });
    expect(hook.state.phase).toBe('summary');
    expect(hook.state.turnResults).toHaveLength(2);
    expect(hook.state.currentCard?.id).not.toBe(cardAtTimeout.id);

    // Avança para equipe Beta e persiste pontos da Alfa no placar
    await act(async () => {
      await hook.actions.nextTurn();
    });
    expect(hook.state.phase).toBe('handoff');
    expect(hook.state.currentTeam?.name).toBe('Beta');

    const teamsAfterAlfa = await teamDs.listTeams();
    expect(teamsAfterAlfa.find((t) => t.id === 't1')?.score).toBe(10);

    // Turno da Beta usando botões Jumbo
    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    act(() => {
      hook.actions.registerHit();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      hook.actions.registerHit();
    });
    act(() => {
      jest.advanceTimersByTime(45000);
    });
    expect(hook.state.phase).toBe('summary');
    expect(hook.state.turnPoints).toBe(20);

    await act(async () => {
      await hook.actions.nextTurn();
    });
    expect(hook.state.phase).toBe('finished');

    const teamsFinal = await teamDs.listTeams();
    expect(teamsFinal.find((t) => t.id === 't2')?.score).toBe(20);

    act(() => {
      hook.actions.goToScoreboard();
    });
    expect(mockReplace).toHaveBeenCalledWith('/scoreboard');
    expect(orientationService.getCurrentMode()).toBe('unlocked');

    hook.unmount();
  });

  it('ignora inclinação quando gesto está desativado e mantém botões funcionando', async () => {
    const { useCase, tiltService } = buildUseCase();
    const hook = renderQuemSouEuHook(useCase);
    await hook.mount();

    act(() => {
      hook.actions.toggleTiltEnabled();
    });
    expect(hook.state.tiltEnabled).toBe(false);

    await act(async () => {
      await hook.actions.startMatch();
    });

    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(hook.state.phase).toBe('playing');

    act(() => {
      tiltService.emitGesture('hit');
    });
    expect(hook.state.turnPoints).toBe(0);
    expect(hook.state.turnResults).toHaveLength(0);

    act(() => {
      hook.actions.registerHit();
    });
    expect(hook.state.turnPoints).toBe(10);

    hook.unmount();
  });

  it('encerra graciosamente quando o banco de cartas se esgota', async () => {
    const tinyDeck: QuemSouEuCard[] = [
      { id: 'only-1', name: 'Leão', pack: 'Animais', hint: 'Felino africano' },
      { id: 'only-2', name: 'Pizza', pack: 'Comidas', hint: 'Massa assada' },
    ];
    const { useCase } = buildUseCase(tinyDeck);
    const hook = renderQuemSouEuHook(useCase);
    await hook.mount();

    await act(async () => {
      await hook.actions.startMatch();
    });

    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    act(() => {
      hook.actions.registerHit();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      hook.actions.registerPass();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(hook.state.deckExhausted).toBe(true);
    expect(hook.state.phase).toBe('summary');

    await act(async () => {
      await hook.actions.nextTurn();
    });
    expect(hook.state.phase).toBe('finished');

    hook.unmount();
  });

  it('pausa o cronômetro ao abrir confirmação de saída e volta ao Hub ao confirmar', async () => {
    const { useCase } = buildUseCase();
    const hook = renderQuemSouEuHook(useCase);
    await hook.mount();

    await act(async () => {
      await hook.actions.startMatch();
    });
    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const secondsBeforePause = hook.state.secondsRemaining;
    act(() => {
      hook.actions.requestExit();
    });
    expect(hook.state.exitConfirmVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(hook.state.secondsRemaining).toBe(secondsBeforePause);

    act(() => {
      hook.actions.cancelExit();
    });
    expect(hook.state.exitConfirmVisible).toBe(false);

    act(() => {
      hook.actions.requestExit();
    });
    act(() => {
      hook.actions.confirmExit();
    });
    expect(mockDismissTo).toHaveBeenCalledWith('/');

    hook.unmount();
  });
});
