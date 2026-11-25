import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemorySoundPreferenceDataSource } from '@/infra/datasources/memorySoundPreferenceDataSource';
import type { SoundPreference } from '@/model/entities/soundPreference';
import { DataSourceError } from '@/model/errors';
import type { ISoundPreferenceUseCases } from '@/usecase/iSoundPreferenceUseCases';
import { SoundPreferenceUseCases } from '@/usecase/soundPreferenceUseCases';
import {
  useSoundPreferenceViewModel,
  type SoundPreferenceActions,
  type SoundPreferenceState,
} from '@/viewmodel/useSoundPreferenceViewModel';

function createHookHarness(useCase: ISoundPreferenceUseCases) {
  let latestState!: SoundPreferenceState;
  let latestActions!: SoundPreferenceActions;

  const Host = () => {
    const [state, actions] = useSoundPreferenceViewModel(useCase);
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
    mountWithoutFlush: () => {
      act(() => {
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

describe('useSoundPreferenceViewModel (#84)', () => {
  it('carrega preferência persistida e permite ligar e desligar o som', async () => {
    const dataSource = new MemorySoundPreferenceDataSource({ enabled: true });
    const useCases = new SoundPreferenceUseCases(dataSource);
    const harness = createHookHarness(useCases);

    await harness.mount();
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().error).toBeNull();
    expect(harness.getState().soundEnabled).toBe(true);

    let saved = false;
    await act(async () => {
      saved = await harness.getActions().handleToggleSound();
    });
    expect(saved).toBe(true);
    expect(harness.getState().soundEnabled).toBe(false);
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: false });

    await act(async () => {
      saved = await harness.getActions().handleSetSoundEnabled(true);
    });
    expect(saved).toBe(true);
    expect(harness.getState().soundEnabled).toBe(true);
    expect(await dataSource.getSoundPreference()).toEqual({ enabled: true });

    harness.unmount();
  });

  it('converte DomainError em state.error mantendo fallback seguro (enabled: true)', async () => {
    const failingUseCase: ISoundPreferenceUseCases = {
      getSoundPreference: async () => {
        throw new DataSourceError('Erro ao ler preferência de som.');
      },
      setSoundEnabled: async () => {
        throw new DataSourceError('Erro ao salvar preferência de som.');
      },
      toggleSoundEnabled: async () => {
        throw new DataSourceError('Erro ao alternar preferência de som.');
      },
    };
    const harness = createHookHarness(failingUseCase);

    await harness.mount();
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().soundEnabled).toBe(true);
    expect(harness.getState().error).toBe('Erro ao ler preferência de som.');

    let saved = true;
    await act(async () => {
      saved = await harness.getActions().handleSetSoundEnabled(false);
    });
    expect(saved).toBe(false);
    expect(harness.getState().error).toBe('Erro ao salvar preferência de som.');

    harness.unmount();
  });

  it('não sobrescreve alteração manual feita antes de finalizar o carregamento inicial', async () => {
    let resolveLoad!: (value: SoundPreference) => void;
    const delayedUseCase: ISoundPreferenceUseCases = {
      getSoundPreference: () =>
        new Promise<SoundPreference>((resolve) => {
          resolveLoad = resolve;
        }),
      setSoundEnabled: async (enabled) => ({ enabled }),
      toggleSoundEnabled: async () => ({ enabled: false }),
    };

    const harness = createHookHarness(delayedUseCase);
    harness.mountWithoutFlush();

    await act(async () => {
      await harness.getActions().handleSetSoundEnabled(false);
    });
    expect(harness.getState().soundEnabled).toBe(false);

    await act(async () => {
      resolveLoad({ enabled: true });
      await Promise.resolve();
    });
    expect(harness.getState().soundEnabled).toBe(false);

    harness.unmount();
  });
});
