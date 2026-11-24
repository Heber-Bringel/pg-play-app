import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Accelerometer } from 'expo-sensors';
import { MemoryQuemSouEuDataSource } from '@/infra/datasources/memoryQuemSouEuDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryScreenOrientationService } from '@/infra/services/memoryScreenOrientationService';
import { ExpoSensorsTiltSensorService } from '@/infra/services/expoSensorsTiltSensorService';
import { QuemSouEuUseCases } from '@/usecase/quemSouEuUseCases';
import { useQuemSouEuViewModel } from '@/viewmodel/useQuemSouEuViewModel';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
    back: jest.fn(),
  }),
}));

type Sample = { x: number; y: number; z: number };
const listeners = new Set<(sample: Sample) => void>();

// Simula o acelerômetro físico enviando uma leitura a todos os listeners ativos
const emitSample = (z: number) => {
  for (const listener of Array.from(listeners)) {
    listener({ x: 0, y: 0, z });
  }
};

// Avança o relógio (Date.now e timers) como o hardware faria a cada leitura
const tick = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const setupPlayingHook = async (tiltEnabled: boolean) => {
  const useCase = new QuemSouEuUseCases(
    new MemoryQuemSouEuDataSource(),
    new MemoryTeamDataSource([
      { id: 't1', name: 'Alfa', score: 0 },
      { id: 't2', name: 'Beta', score: 0 },
    ]),
    new ExpoSensorsTiltSensorService(),
    new MemoryScreenOrientationService()
  );

  let latestState!: ReturnType<typeof useQuemSouEuViewModel>[0];
  let latestActions!: ReturnType<typeof useQuemSouEuViewModel>[1];
  const Host = () => {
    const [state, actions] = useQuemSouEuViewModel(useCase);
    latestState = state;
    latestActions = actions;
    return null;
  };

  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(React.createElement(Host));
  });
  act(() => latestActions.setTiltEnabled(tiltEnabled));
  await act(async () => {
    await latestActions.startMatch();
  });
  act(() => latestActions.startTurn());
  tick(3000);

  return {
    get state() {
      return latestState;
    },
    get actions() {
      return latestActions;
    },
    unmount: () => act(() => tree.unmount()),
  };
};

describe('useQuemSouEuViewModel · regressão de inclinação e cronômetro', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    listeners.clear();
    (Accelerometer.addListener as jest.Mock).mockImplementation(
      (callback: (sample: Sample) => void) => {
        listeners.add(callback);
        return { remove: () => listeners.delete(callback) };
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    (Accelerometer.addListener as jest.Mock).mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  it('mantém uma única inscrição no sensor durante o turno', async () => {
    const hook = await setupPlayingHook(true);
    expect(hook.state.phase).toBe('playing');
    expect(listeners.size).toBe(1);

    act(() => hook.actions.registerPass());
    act(() => hook.actions.registerHit());
    expect(listeners.size).toBe(1);

    hook.unmount();
  });

  it('um único gesto mantido por 500 ms registra apenas 1 carta', async () => {
    const hook = await setupPlayingHook(true);
    const firstCard = hook.state.currentCard!;

    act(() => emitSample(0));
    for (let i = 0; i < 5; i += 1) {
      tick(100);
      act(() => emitSample(0.9));
    }
    tick(100);
    act(() => emitSample(0));

    expect(hook.state.turnResults).toHaveLength(1);
    expect(hook.state.turnResults[0].card.id).toBe(firstCard.id);
    expect(hook.state.turnResults[0].outcome).toBe('hit');

    hook.unmount();
  });

  it('registra novo gesto somente após voltar ao neutro e respeitar o cooldown', async () => {
    const hook = await setupPlayingHook(true);

    act(() => emitSample(0));
    tick(100);
    act(() => emitSample(0.9)); // acerto
    tick(100);
    act(() => emitSample(0)); // neutro, mas ainda em cooldown
    tick(100);
    act(() => emitSample(-0.9)); // ignorado pelo cooldown
    expect(hook.state.turnResults).toHaveLength(1);

    tick(1200);
    act(() => emitSample(0));
    tick(100);
    act(() => emitSample(-0.9)); // passe válido
    expect(hook.state.turnResults.map((r) => r.outcome)).toEqual([
      'hit',
      'pass',
    ]);

    hook.unmount();
  });

  it('botão não dispara gesto extra quando o celular já está inclinado na mão', async () => {
    const hook = await setupPlayingHook(true);

    // Celular segurado num ângulo além do limite antes de qualquer neutro
    act(() => emitSample(0.85));
    act(() => hook.actions.registerPass());
    tick(100);
    act(() => emitSample(0.85));
    tick(100);
    act(() => emitSample(0.85));

    expect(hook.state.turnResults).toHaveLength(1);
    expect(hook.state.turnResults[0].outcome).toBe('pass');

    hook.unmount();
  });

  it('mantém a carta respondida na tela durante o feedback e só depois troca', async () => {
    const hook = await setupPlayingHook(false);
    const answeredCard = hook.state.currentCard!;

    act(() => hook.actions.registerHit());
    expect(hook.state.lastFeedback?.outcome).toBe('hit');
    expect(hook.state.currentCard?.id).toBe(answeredCard.id);

    // Toques durante o feedback são ignorados
    tick(500);
    act(() => hook.actions.registerPass());
    expect(hook.state.turnResults).toHaveLength(1);
    expect(hook.state.currentCard?.id).toBe(answeredCard.id);

    // Após 1 s o feedback some e a próxima carta aparece
    tick(500);
    expect(hook.state.lastFeedback).toBeNull();
    expect(hook.state.currentCard?.id).not.toBe(answeredCard.id);
    expect(hook.state.turnResults[0].card.id).toBe(answeredCard.id);

    hook.unmount();
  });

  it('cronômetro não atrasa quando as cartas são respondidas rapidamente', async () => {
    const hook = await setupPlayingHook(false);
    const start = hook.state.secondsRemaining;

    // 8 respostas, uma a cada 1,1 s = 8,8 s
    for (let i = 0; i < 8; i += 1) {
      tick(1100);
      act(() => hook.actions.registerPass());
    }

    expect(start - hook.state.secondsRemaining).toBe(8);
    expect(hook.state.turnResults).toHaveLength(8);

    hook.unmount();
  });
});
