import React from 'react';
import renderer, { act } from 'react-test-renderer';
import TeamsRoute from '@/app/teams';
import TeamsScreen from '@/view/teams';
import * as teamsVmModule from '@/viewmodel/useTeamsViewModel';
import type { TeamsActions, TeamsState } from '@/viewmodel/useTeamsViewModel';

const createMockActions = (): TeamsActions => ({
  setNewTeamName: jest.fn(),
  handleAddTeam: jest.fn(async () => {}),
  handleRemoveTeam: jest.fn(async () => {}),
  handleStartRound: jest.fn(),
  handleBack: jest.fn(),
  handleSelectNav: jest.fn(),
  clearError: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: TeamsState = {
  teams: [
    { id: 't1', name: 'Tribo de Judá', score: 0 },
    { id: 't2', name: 'Leões da Fé', score: 0 },
  ],
  newTeamName: '',
  errorMessage: null,
  loading: false,
  canStartRound: true,
};

describe('TeamsScreen — Testes de Tela com Mocks de ViewModel (UC01 / UC02)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/teams.tsx', () => {
    expect(TeamsRoute).toBe(TeamsScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(teamsVmModule, 'useTeamsViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TeamsScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some(
        (t) => t.props.children === 'Carregando equipes do Pequeno Grupo...'
      )
    ).toBe(true);
  });

  it('deve renderizar o estado com equipes cadastradas, contador 2/6 e botão Escolher Jogo habilitado', () => {
    const actions = createMockActions();
    jest
      .spyOn(teamsVmModule, 'useTeamsViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TeamsScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Tribo de Judá')).toBe(true);
    expect(texts.some((t) => t.props.children === 'Leões da Fé')).toBe(true);
    expect(texts.some((t) => t.props.children === '2/6')).toBe(true);
    expect(texts.some((t) => t.props.children === 'Escolher Jogo')).toBe(true);
  });

  it('deve renderizar o estado vazio quando não houver equipes', () => {
    const actions = createMockActions();
    jest
      .spyOn(teamsVmModule, 'useTeamsViewModel')
      .mockReturnValue([
        { ...baseState, teams: [], canStartRound: false },
        actions,
      ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TeamsScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Nenhuma equipe cadastrada ainda')
    ).toBe(true);
  });

  it('deve acionar handleRemoveTeam ao clicar no botão de exclusão de equipe', () => {
    const actions = createMockActions();
    jest
      .spyOn(teamsVmModule, 'useTeamsViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TeamsScreen />);
    });

    const removeBtn = tree.root.findByProps({
      accessibilityLabel: 'Remover equipe Tribo de Judá',
    });

    act(() => {
      removeBtn.props.onPress();
    });

    expect(actions.handleRemoveTeam).toHaveBeenCalledWith('t1');
  });

  it('deve acionar handleStartRound ao tocar no botão Escolher Jogo', () => {
    const actions = createMockActions();
    jest
      .spyOn(teamsVmModule, 'useTeamsViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TeamsScreen />);
    });

    const startBtn = tree.root.findByProps({
      accessibilityLabel: 'Escolher Jogo',
    });

    act(() => {
      startBtn.props.onPress();
    });

    expect(actions.handleStartRound).toHaveBeenCalled();
  });

  it('deve navegar pelas abas da ShortNavigationBar', () => {
    const actions = createMockActions();
    jest
      .spyOn(teamsVmModule, 'useTeamsViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TeamsScreen />);
    });

    const homeTab = tree.root.findByProps({
      accessibilityLabel: 'Ir para Início',
    });
    const gamesTab = tree.root.findByProps({
      accessibilityLabel: 'Ir para Jogos',
    });

    act(() => {
      homeTab.props.onPress();
      gamesTab.props.onPress();
    });

    expect(actions.handleSelectNav).toHaveBeenNthCalledWith(1, 'welcome');
    expect(actions.handleSelectNav).toHaveBeenNthCalledWith(2, 'games');
  });
});
