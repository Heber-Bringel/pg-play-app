import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import {
  useTeamsViewModel,
  type TeamsActions,
  type TeamsState,
} from '@/viewmodel/useTeamsViewModel';
import { mockBack, mockPush } from '../__mocks__/expo-router';

function createHookHarness(useCases: IPgPlayUseCases) {
  let latestState!: TeamsState;
  let latestActions!: TeamsActions;

  const Host = () => {
    const [state, actions] = useTeamsViewModel(useCases);
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

describe('useTeamsViewModel — Hook de Configuração e Gestão de Equipes (UC01 / UC02)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('deve carregar as 2 equipes padrão ao montar e definir canStartRound = true (RF05, RF08)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    const state = harness.getState();
    expect(state.loading).toBe(false);
    expect(state.teams).toHaveLength(2);
    expect(state.canStartRound).toBe(true);
    expect(state.errorMessage).toBeNull();
    expect(state.newTeamName).toBe('');

    harness.unmount();
  });

  it('deve adicionar nova equipe, limpar newTeamName e atualizar a lista (RF06)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().setNewTeamName('Guerreiros');
    });
    expect(harness.getState().newTeamName).toBe('Guerreiros');

    await act(async () => {
      await harness.getActions().handleAddTeam();
    });

    const state = harness.getState();
    expect(state.teams).toHaveLength(3);
    expect(state.teams.some((t) => t.name === 'Guerreiros')).toBe(true);
    expect(state.newTeamName).toBe('');
    expect(state.errorMessage).toBeNull();

    harness.unmount();
  });

  it('deve capturar ValidationError e exibir errorMessage ao tentar nome inválido (RF06)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().setNewTeamName('A');
    });

    await act(async () => {
      await harness.getActions().handleAddTeam();
    });

    const state = harness.getState();
    expect(state.errorMessage).toBe('Digite um nome com pelo menos 2 letras para a equipe.');
    expect(state.teams).toHaveLength(2);

    act(() => {
      harness.getActions().clearError();
    });
    expect(harness.getState().errorMessage).toBeNull();

    harness.unmount();
  });

  it('deve capturar erro ao tentar adicionar equipe duplicada (RF06)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().setNewTeamName('Tribo de Judá');
    });

    await act(async () => {
      await harness.getActions().handleAddTeam();
    });

    const state = harness.getState();
    expect(state.errorMessage).toBe('Já existe uma equipe cadastrada com este nome.');

    harness.unmount();
  });

  it('deve remover equipe e desabilitar canStartRound se restar apenas 1 (RF07, RF08)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    const team1Id = harness.getState().teams[0].id;

    await act(async () => {
      await harness.getActions().handleRemoveTeam(team1Id);
    });

    const state = harness.getState();
    expect(state.teams).toHaveLength(1);
    expect(state.canStartRound).toBe(false);

    harness.unmount();
  });

  it('deve navegar para a arena ao iniciar rodada com pelo menos 2 equipes (RF08)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleStartRound();
    });

    expect(mockPush).toHaveBeenCalledWith('/mimica');

    harness.unmount();
  });

  it('deve bloquear início da rodada e exibir erro se canStartRound for falso (RF08)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource([{ id: '1', name: 'Só Uma', score: 0 }]),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    expect(harness.getState().canStartRound).toBe(false);

    act(() => {
      harness.getActions().handleStartRound();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(harness.getState().errorMessage).toBe(
      'Adicione pelo menos 2 equipes para começar a rodada.'
    );

    harness.unmount();
  });

  it('deve chamar router.back ao acionar handleBack', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource()
    );
    const harness = createHookHarness(useCases);
    await harness.mount();

    act(() => {
      harness.getActions().handleBack();
    });

    expect(mockBack).toHaveBeenCalled();

    harness.unmount();
  });
});
