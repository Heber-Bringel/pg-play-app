import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryThemePreferenceDataSource } from '@/infra/datasources/memoryThemePreferenceDataSource';
import type { ThemePreference } from '@/model/entities/themePreference';
import { DataSourceError } from '@/model/errors';
import type { IThemePreferenceUseCases } from '@/usecase/iThemePreferenceUseCases';
import { ThemePreferenceUseCases } from '@/usecase/themePreferenceUseCases';
import {
  useThemePreferenceViewModel,
  type ThemePreferenceActions,
  type ThemePreferenceState,
} from '@/viewmodel/useThemePreferenceViewModel';

function createHookHarness(useCase: IThemePreferenceUseCases) {
  let latestState!: ThemePreferenceState;
  let latestActions!: ThemePreferenceActions;

  const Host = () => {
    const [state, actions] = useThemePreferenceViewModel(useCase);
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

describe('useThemePreferenceViewModel', () => {
  it('carrega preferência persistida e permite alternar entre dark, light e auto', async () => {
    const dataSource = new MemoryThemePreferenceDataSource('dark');
    const useCases = new ThemePreferenceUseCases(dataSource);
    const harness = createHookHarness(useCases);

    await harness.mount();
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().error).toBeNull();
    expect(harness.getState().preference).toBe('dark');

    let saved = false;
    await act(async () => {
      saved = await harness.getActions().handleSetThemePreference('light');
    });
    expect(saved).toBe(true);
    expect(harness.getState().preference).toBe('light');
    expect(await dataSource.getThemePreference()).toBe('light');

    await act(async () => {
      saved = await harness.getActions().handleSetThemePreference('auto');
    });
    expect(saved).toBe(true);
    expect(harness.getState().preference).toBe('auto');
    expect(await dataSource.getThemePreference()).toBe('auto');

    harness.unmount();
  });

  it('converte DomainError em state.error mantendo fallback seguro', async () => {
    const failingUseCase: IThemePreferenceUseCases = {
      getThemePreference: async () => {
        throw new DataSourceError('Erro ao ler tema salvo.');
      },
      setThemePreference: async () => {
        throw new DataSourceError('Erro ao salvar tema.');
      },
    };
    const harness = createHookHarness(failingUseCase);

    await harness.mount();
    expect(harness.getState().loading).toBe(false);
    expect(harness.getState().preference).toBe('auto');
    expect(harness.getState().error).toBe('Erro ao ler tema salvo.');

    let saved = true;
    await act(async () => {
      saved = await harness.getActions().handleSetThemePreference('dark');
    });
    expect(saved).toBe(false);
    expect(harness.getState().error).toBe('Erro ao salvar tema.');

    harness.unmount();
  });

  it('não sobrescreve seleção manual feita antes de finalizar o carregamento inicial', async () => {
    let resolveLoad!: (value: ThemePreference) => void;
    const delayedUseCase: IThemePreferenceUseCases = {
      getThemePreference: () =>
        new Promise<ThemePreference>((resolve) => {
          resolveLoad = resolve;
        }),
      setThemePreference: async (pref) => pref,
    };

    const harness = createHookHarness(delayedUseCase);
    harness.mountWithoutFlush();

    await act(async () => {
      await harness.getActions().handleSetThemePreference('dark');
    });
    expect(harness.getState().preference).toBe('dark');

    await act(async () => {
      resolveLoad('light');
      await Promise.resolve();
    });
    expect(harness.getState().preference).toBe('dark');

    harness.unmount();
  });
});
