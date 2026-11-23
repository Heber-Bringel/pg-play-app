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

  it('deve iniciar na fase setup com modo custom (Lista de nomes) e separar fieldError de setupError (RF38, Issues #48 e #53)', async () => {
    const useCases = new TermometroUseCases(new MemoryTeamDataSource());
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().stage).toBe('setup');
    expect(harness.getState().participantMode).toBe('custom');
    expect(harness.getState().durationMinutes).toBe(1);
    expect(harness.getState().participants).toEqual([]);

    // Tentar começar sem participantes gera setupError (e não fieldError)
    await act(async () => {
      await harness.getActions().handleStartMoment();
    });
    expect(harness.getState().setupError).toContain('pelo menos 1 participante');
    expect(harness.getState().fieldError).toBeNull();

    // Tentar adicionar nome curto gera fieldError
    let added = false;
    await act(async () => {
      added = await harness.getActions().handleAddCustomParticipant('A');
    });
    expect(added).toBe(false);
    expect(harness.getState().fieldError).toContain('pelo menos 2 letras');

    // Digitar limpa os erros de campo e setup
    act(() => {
      harness.getActions().handleClearFieldErrors();
    });
    expect(harness.getState().fieldError).toBeNull();
    expect(harness.getState().setupError).toBeNull();

    await act(async () => {
      await harness.getActions().handleSelectDuration(2);
      await harness.getActions().handleSelectOrderMode('random');
      added = await harness.getActions().handleAddCustomParticipant('Rebeca');
    });
    expect(added).toBe(true);
    expect(harness.getState().durationMinutes).toBe(2);
    expect(harness.getState().durationSeconds).toBe(120);
    expect(harness.getState().orderMode).toBe('random');
    expect(harness.getState().participants).toEqual(['Rebeca']);

    await act(async () => {
      await harness.getActions().handleRemoveCustomParticipant('Rebeca');
    });
    expect(harness.getState().participants).toEqual([]);

    harness.unmount();
  });

  it('deve conduzir a roda de fala, exibir fechamento acolhedor (closed) antes de voltar ao Hub e descartar sessão ao desmontar (Issues #49, #52 e #54)', async () => {
    const useCases = new TermometroUseCases();
    const endSessionSpy = jest.spyOn(useCases, 'endSession');
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleAddCustomParticipant('Ana');
      await harness.getActions().handleAddCustomParticipant('Pedro');
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

    // Pedro pula sua vez antes de falar -> vai para summary anônimo
    await act(async () => {
      await harness.getActions().handleSkipSpeaker();
    });
    expect(harness.getState().stage).toBe('summary');
    expect(harness.getState().sharedCount).toBe(1);
    expect(harness.getState().skippedCount).toBe(1);
    expect(harness.getState().summaryTitle).toBe('Roda de pedidos concluída');
    expect(harness.getState().participants).toEqual([]);

    // Issue #54: confirmação ao tentar encerrar direto do resumo sem oração
    act(() => {
      harness.getActions().handleRequestEndFromSummary();
    });
    expect(harness.getState().confirmingEndWithoutPrayer).toBe(true);
    act(() => {
      harness.getActions().handleCancelEndWithoutPrayer();
    });
    expect(harness.getState().confirmingEndWithoutPrayer).toBe(false);

    // Abrir Momento de Oração
    await act(async () => {
      await harness.getActions().handleOpenPrayerMoment();
    });
    expect(harness.getState().stage).toBe('prayer');

    // Issue #54: Encerrar Encontro mostra tela 'closed' com mensagem acolhedora antes de navegar
    await act(async () => {
      await harness.getActions().handleEndEncounter();
    });
    expect(harness.getState().stage).toBe('closed');
    expect(mockReplace).not.toHaveBeenCalled();

    // Tocar em "Voltar ao Hub" navega para '/'
    await act(async () => {
      await harness.getActions().handleBackToHub();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');

    // Issue #52: desmontar o hook chama endSession() garantindo descarte de memória (RNF12)
    endSessionSpy.mockClear();
    harness.unmount();
    expect(endSessionSpy).toHaveBeenCalledTimes(1);
  });

  it('deve suportar modo livre, confirmação de saída segura e tratamento de erro inicial', async () => {
    const useCases = new TermometroUseCases();
    const harness = createHookHarness(useCases);
    await harness.mount();

    await act(async () => {
      await harness.getActions().handleSelectParticipantMode('free');
      await harness.getActions().handleStartMoment();
      await harness.getActions().handleStartSpeaking();
    });
    expect(harness.getState().stage).toBe('turn');
    expect(harness.getState().currentSpeakerLabel).toBe('Próxima pessoa');

    await act(async () => {
      await harness.getActions().handleFinishFreeMode();
    });
    expect(harness.getState().stage).toBe('summary');
    expect(harness.getState().sharedCount).toBe(1);
    expect(harness.getState().summaryTitle).toBe('Todos compartilharam');

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
        title: 'Roda de pedidos concluída',
        sharedCount: 0,
        skippedCount: 0,
        totalParticipants: 0,
      }),
      closeEncounter: async () => {
        throw new ValidationError('Erro');
      },
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
