import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryVerseDataSource } from '@/infra/datasources/memoryVerseDataSource';
import { VersiculoUseCases } from '@/usecase/versiculoUseCases';
import { useVersiculoViewModel } from '@/viewmodel/useVersiculoViewModel';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

function renderVersiculoHook(useCase: VersiculoUseCases) {
  let latestState!: ReturnType<typeof useVersiculoViewModel>[0];
  let latestActions!: ReturnType<typeof useVersiculoViewModel>[1];

  const Host = () => {
    const [state, actions] = useVersiculoViewModel(useCase);
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

describe('useVersiculoViewModel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const buildUseCase = () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 't1', name: 'Alfa', score: 0 },
      { id: 't2', name: 'Beta', score: 0 },
    ]);
    const verseDs = new MemoryVerseDataSource();
    return { useCase: new VersiculoUseCases(verseDs, teamDs), teamDs };
  };

  it('carrega equipes e conduz fluxo completo de setup -> handoff -> playing -> review -> finished', async () => {
    const { useCase, teamDs } = buildUseCase();
    const hook = renderVersiculoHook(useCase);
    await hook.mount();

    expect(hook.state.loading).toBe(false);
    expect(hook.state.phase).toBe('setup');
    expect(hook.state.teams).toHaveLength(2);

    act(() => {
      hook.actions.togglePack('Salmos e Provérbios');
      hook.actions.togglePack('Cartas de Paulo');
      hook.actions.togglePack('Antigo Testamento');
      hook.actions.selectDuration(30);
      hook.actions.selectPassagesPerTeam(1);
    });

    await act(async () => {
      await hook.actions.startMatch();
    });

    expect(hook.state.phase).toBe('handoff');
    expect(hook.state.passages).toHaveLength(2);

    act(() => {
      hook.actions.startTurn();
    });

    expect(hook.state.phase).toBe('playing');
    expect(hook.state.secondsRemaining).toBe(30);

    act(() => {
      hook.actions.revealHint();
    });

    expect(hook.state.usedHint).toBe(true);
    expect(hook.state.hints.length).toBeGreaterThan(0);

    const firstPassage = hook.state.currentPassage!;
    act(() => {
      firstPassage.blanks.forEach((blank) => {
        hook.actions.setAnswer(blank.index, blank.answer);
      });
    });

    act(() => {
      hook.actions.submitAnswers();
    });

    expect(hook.state.phase).toBe('review');
    expect(hook.state.turnPoints).toBe(firstPassage.blanks.length * 5);

    await act(async () => {
      await hook.actions.nextTurn();
    });

    expect(hook.state.phase).toBe('handoff');
    expect(hook.state.currentPassageIndex).toBe(1);

    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      hook.actions.submitAnswers();
    });
    expect(hook.state.phase).toBe('review');
    expect(hook.state.turnPoints).toBe(0);

    await act(async () => {
      await hook.actions.nextTurn();
    });

    expect(hook.state.phase).toBe('finished');
    const savedTeams = await teamDs.listTeams();
    expect(savedTeams[0].score).toBe(firstPassage.blanks.length * 5);
    expect(savedTeams[1].score).toBe(0);

    act(() => {
      hook.actions.goToScoreboard();
    });
    expect(mockReplace).toHaveBeenCalledWith('/scoreboard');

    hook.unmount();
  });

  it('exibe erro de validação quando todos os pacotes são desmarcados', async () => {
    const { useCase } = buildUseCase();
    const hook = renderVersiculoHook(useCase);
    await hook.mount();

    act(() => {
      hook.actions.togglePack('Salmos e Provérbios');
      hook.actions.togglePack('Evangelhos');
      hook.actions.togglePack('Cartas de Paulo');
      hook.actions.togglePack('Antigo Testamento');
    });

    await act(async () => {
      await hook.actions.startMatch();
    });

    expect(hook.state.phase).toBe('setup');
    expect(hook.state.error).toContain('Selecione pelo menos 1 pacote');

    act(() => {
      hook.actions.requestExit();
    });
    expect(hook.state.exitConfirmVisible).toBe(true);

    act(() => {
      hook.actions.confirmExit();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    hook.unmount();
  });
});
