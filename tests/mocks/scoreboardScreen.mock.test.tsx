import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ScoreboardRoute from '@/app/scoreboard';
import ScoreboardScreen from '@/view/scoreboard';
import * as scoreboardVmModule from '@/viewmodel/useScoreboardViewModel';
import type { ScoreboardActions, ScoreboardState } from '@/viewmodel/useScoreboardViewModel';

const createMockActions = (): ScoreboardActions => ({
  handleRequestReset: jest.fn(),
  handleCancelReset: jest.fn(),
  handleResetScoreboard: jest.fn(async () => {}),
  handleChooseAnotherGame: jest.fn(),
  handleBack: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: ScoreboardState = {
  teams: [
    { id: 't1', name: 'Tribo de Judá', score: 40 },
    { id: 't2', name: 'Leões da Fé', score: 20 },
  ],
  leaderTeam: { id: 't1', name: 'Tribo de Judá', score: 40 },
  totalPoints: 60,
  loading: false,
  error: null,
  confirmingReset: false,
};

describe('ScoreboardScreen — Testes de Tela com Mocks de ViewModel (UC06)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/scoreboard.tsx', () => {
    expect(ScoreboardRoute).toBe(ScoreboardScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(scoreboardVmModule, 'useScoreboardViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ScoreboardScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Calculando o Ranking do Encontro...')
    ).toBe(true);
  });

  it('deve renderizar o estado de erro semântico e permitir tentar novamente', () => {
    const actions = createMockActions();
    jest
      .spyOn(scoreboardVmModule, 'useScoreboardViewModel')
      .mockReturnValue([
        { ...baseState, error: 'Erro ao carregar ranking do encontro.' },
        actions,
      ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ScoreboardScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Erro ao carregar ranking do encontro.')
    ).toBe(true);

    const retryBtn = tree.root.findByProps({ accessibilityLabel: 'Tentar Novamente' } as any);
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o estado vazio quando não houver equipes no placar', () => {
    const actions = createMockActions();
    jest
      .spyOn(scoreboardVmModule, 'useScoreboardViewModel')
      .mockReturnValue([{ ...baseState, teams: [], leaderTeam: null, totalPoints: 0 }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ScoreboardScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Nenhuma Equipe no Placar')).toBe(true);
  });

  it('deve renderizar o ranking completo sem botão de bônus manual e acionar escolher outro jogo e zerar placar (RF16, RF17)', () => {
    const actions = createMockActions();
    jest
      .spyOn(scoreboardVmModule, 'useScoreboardViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ScoreboardScreen />);
    });

    const bonusButtons = tree.root.findAll(
      (node) =>
        typeof node.props?.accessibilityLabel === 'string' &&
        node.props.accessibilityLabel.includes('Bônus')
    );
    expect(bonusButtons).toHaveLength(0);

    const backBtn = tree.root.findByProps({
      accessibilityLabel: 'Voltar',
    } as any);
    const chooseBtn = tree.root.findByProps({
      accessibilityLabel: 'Escolher Outro Jogo',
    } as any);
    const resetBtn = tree.root.findByProps({
      accessibilityLabel: 'Zerar Placar do PG',
    } as any);

    act(() => {
      backBtn.props.onPress();
      chooseBtn.props.onPress();
      resetBtn.props.onPress();
    });

    expect(actions.handleBack).toHaveBeenCalledTimes(1);
    expect(actions.handleChooseAnotherGame).toHaveBeenCalledTimes(1);
    expect(actions.handleRequestReset).toHaveBeenCalledTimes(1);
    expect(actions.handleResetScoreboard).not.toHaveBeenCalled();
  });

  it('deve pedir confirmação antes de zerar o placar e permitir cancelar (RF17)', () => {
    const actions = createMockActions();
    jest
      .spyOn(scoreboardVmModule, 'useScoreboardViewModel')
      .mockReturnValue([{ ...baseState, confirmingReset: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ScoreboardScreen />);
    });

    const cancelBtn = tree.root.findByProps({ accessibilityLabel: 'Cancelar' } as any);
    const confirmBtn = tree.root.findByProps({
      accessibilityLabel: 'Confirmar e Zerar',
    } as any);

    act(() => {
      cancelBtn.props.onPress();
      confirmBtn.props.onPress();
    });

    expect(actions.handleCancelReset).toHaveBeenCalledTimes(1);
    expect(actions.handleResetScoreboard).toHaveBeenCalledTimes(1);
  });

  it('deve exibir resumo do encontro e desabilitar Zerar Placar quando pontuação total for zero', () => {
    const actions = createMockActions();
    jest.spyOn(scoreboardVmModule, 'useScoreboardViewModel').mockReturnValue([
      {
        ...baseState,
        teams: [
          { id: 't1', name: 'Tribo de Judá', score: 0 },
          { id: 't2', name: 'Leões da Fé', score: 0 },
        ],
        leaderTeam: null,
        totalPoints: 0,
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ScoreboardScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === '2 equipes · 0 pts no encontro')).toBe(true);
    expect(
      texts.some((t) => t.props.children === 'Jogue uma dinâmica para começar a pontuar')
    ).toBe(true);

    const resetBtn = tree.root.findByProps({
      accessibilityLabel: 'Zerar Placar do PG',
    } as any);
    expect(resetBtn.props.disabled).toBe(true);
  });
});
