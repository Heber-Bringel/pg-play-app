import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import type { ITermometroUseCases } from '@/usecase/iTermometroUseCases';
import { TermometroUseCases } from '@/usecase/termometroUseCases';
import {
  useTermometroViewModel,
  type TermometroActions,
  type TermometroState,
} from '@/viewmodel/useTermometroViewModel';
import { mockReplace } from '../__mocks__/expo-router';

function createHookHarness(useCases: ITermometroUseCases) {
  let latestState!: TermometroState;
  let latestActions!: TermometroActions;

  const Host = () => {
    const [state, actions] = useTermometroViewModel(useCases);
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

describe('useTermometroViewModel — Hook do Termômetro de Pedidos (UC11)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve iniciar na fase setup com equipes sugeridas e configurar tempo, ordem e nomes digitados (RF38)', async () => {
    const useCases = new TermometroUseCases(new MemoryTeamDataSource());
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().stage).toBe('setup');
    expect(harness.getState().participantMode).toBe('teams');
    expect(harness.getState().durationMinutes).toBe(1);
    expect(harness.getState().participants).toEqual([
      'Tribo de Judá',
      'Leões da Fé',
    ]);

    await act(async () => {
      await harness.getActions().handleSelectDuration(2);
      await harness.getActions().handleSelectOrderMode('random');
      await harness.getActions().handleSelectParticipantMode('custom');
    });

    expect(harness.getState().durationMinutes).toBe(2);
    expect(harness.getState().durationSeconds).toBe(120);
    expect(harness.getState().orderMode).toBe('random');
    expect(harness.getState().participantMode).toBe('custom');

    let added = false;
    await act(async () => {
      added = await harness.getActions().handleAddCustomParticipant('A');
    });
    expect(added).toBe(false);
    expect(harness.getState().inputError).toContain('pelo menos 2 letras');

    await act(async () => {
      added = await harness.getActions().handleAddCustomParticipant('Rebeca');
    });
    expect(added).toBe(true);
    expect(harness.getState().participants).toEqual(['Rebeca']);

    await act(async () => {
      await harness.getActions().handleRemoveCustomParticipant('Rebeca');
    });
    expect(harness.getState().participants).toEqual([]);

    harness.unmount();
  });

  it('deve conduzir a roda de fala, contar tempo apenas após Começar a falar, não cortar ao fim, e gerar resumo anônimo (RF39, RF40, RNF12)', async () => {
    const useCases = new TermometroUseCases(
      new MemoryTeamDataSource([
        { id: 't1', name: 'Ana', score: 20 },
        { id: 't2', name: 'Pedro', score: 40 },
      ])
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleStartMoment();
    });
    expect(harness.getState().stage).toBe('turn');
    expect(harness.getState().currentSpeakerLabel).toBe('Ana');
    expect(harness.getState().hasStartedSpeaking).toBe(false);

    // O timer não corre antes de tocar em "Começar a falar"
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(harness.getState().secondsRemaining).toBe(60);

    await act(async () => {
      await harness.getActions().handleStartSpeaking();
    });
    expect(harness.getState().hasStartedSpeaking).toBe(true);

    await act(async () => {
      await harness.getActions().handleTick();
      await harness.getActions().handleTick();
    });
    expect(harness.getState().secondsRemaining).toBe(58);

    // Pausar e retomar
    await act(async () => {
      await harness.getActions().handleTogglePause();
    });
    expect(harness.getState().isPaused).toBe(true);

    await act(async () => {
      await harness.getActions().handleTogglePause();
    });
    expect(harness.getState().isPaused).toBe(false);

    // Ana conclui e passa para Pedro
    await act(async () => {
      await harness.getActions().handleNextSpeaker();
    });
    expect(harness.getState().currentSpeakerLabel).toBe('Pedro');
    expect(harness.getState().sharedCount).toBe(1);

    // Pedro pula sua vez -> vai para summary anônimo sem nomes
    await act(async () => {
      await harness.getActions().handleSkipSpeaker();
    });
    expect(harness.getState().stage).toBe('summary');
    expect(harness.getState().sharedCount).toBe(1);
    expect(harness.getState().skippedCount).toBe(1);
    expect(harness.getState().participants).toEqual([]);

    // Abrir Momento de Oração
    await act(async () => {
      await harness.getActions().handleOpenPrayerMoment();
    });
    expect(harness.getState().stage).toBe('prayer');

    // Encerrar Encontro descarta sessão e volta ao Hub
    await act(async () => {
      await harness.getActions().handleEndEncounter();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    harness.unmount();
  });

  it('deve suportar modo livre, confirmação de saída segura e tratamento de erro inicial', async () => {
    const useCases = new TermometroUseCases(new MemoryTeamDataSource());
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleSelectParticipantMode('free');
      await harness.getActions().handleStartMoment();
    });
    expect(harness.getState().stage).toBe('turn');
    expect(harness.getState().currentSpeakerLabel).toBe('Próxima pessoa');

    await act(async () => {
      await harness.getActions().handleFinishFreeMode();
    });
    expect(harness.getState().stage).toBe('summary');

    act(() => {
      harness.getActions().handleRequestExit();
    });
    expect(harness.getState().confirmingExit).toBe(true);

    act(() => {
      harness.getActions().handleCancelExit();
    });
    expect(harness.getState().confirmingExit).toBe(false);

    await act(async () => {
      await harness.getActions().handleConfirmExit();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    harness.unmount();

    const failingUseCases: ITermometroUseCases = {
      getSession: async () => {
        throw new ValidationError('Erro simulado ao carregar Termômetro.');
      },
      setParticipantMode: async () => {
        throw new ValidationError('Erro');
      },
      setDurationMinutes: async () => {
        throw new ValidationError('Erro');
      },
      setOrderMode: async () => {
        throw new ValidationError('Erro');
      },
      addCustomParticipant: async () => {
        throw new ValidationError('Erro');
      },
      removeCustomParticipant: async () => {
        throw new ValidationError('Erro');
      },
      startMoment: async () => {
        throw new ValidationError('Erro');
      },
      startSpeaking: async () => {
        throw new ValidationError('Erro');
      },
      tickSecond: async () => {
        throw new ValidationError('Erro');
      },
      togglePause: async () => {
        throw new ValidationError('Erro');
      },
      nextSpeaker: async () => {
        throw new ValidationError('Erro');
      },
      skipSpeaker: async () => {
        throw new ValidationError('Erro');
      },
      finishFreeMode: async () => {
        throw new ValidationError('Erro');
      },
      openPrayerMoment: async () => {
        throw new ValidationError('Erro');
      },
      getAnonymousSummary: async () => ({
        sharedCount: 0,
        skippedCount: 0,
        totalParticipants: 0,
      }),
      endSession: async () => {
        throw new ValidationError('Erro');
      },
    };

    const errHarness = createHookHarness(failingUseCases);
    await errHarness.mount();
    expect(errHarness.getState().error).toBe(
      'Erro simulado ao carregar Termômetro.'
    );
    errHarness.unmount();
  });
});
