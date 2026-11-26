import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MimicaRoute from '@/app/mimica';
import MimicaScreen from '@/view/mimica';
import * as mimicaVmModule from '@/viewmodel/useMimicaViewModel';
import type { MimicaActions, MimicaState } from '@/viewmodel/useMimicaViewModel';

const createMockActions = (): MimicaActions => ({
  handleSetReduceMotion: jest.fn(),
  handleStartTurn: jest.fn(),
  handleToggleWordVisibility: jest.fn(),
  handleHit: jest.fn(async () => {}),
  handleSkip: jest.fn(async () => {}),
  handleTick: jest.fn(),
  handleNextTurn: jest.fn(),
  handleSelectDuration: jest.fn(),
  handleSelectRounds: jest.fn(),
  handleToggleCategory: jest.fn(async () => {}),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn(),
  handleGoToTeams: jest.fn(),
  handleGoToScoreboard: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: MimicaState = {
  reduceMotion: false,
  phase: 'pass-turn',
  teams: [
    { id: 't1', name: 'Tribo de Judá', score: 40 },
    { id: 't2', name: 'Leões da Fé', score: 20 },
  ],
  currentTeamIndex: 0,
  currentTeam: { id: 't1', name: 'Tribo de Judá', score: 40 },
  currentRound: 1,
  totalRounds: 3,
  isLastTurn: false,
  turnDurationSeconds: 60,
  secondsRemaining: 60,
  selectedCategories: ['Bíblico'],
  currentCard: { id: 'c1', word: 'Arca de Noé', category: 'Bíblico', points: 20 },
  remainingCardsCount: 10,
  wordVisible: true,
  turnHits: 2,
  turnSkips: 1,
  turnPointsDelta: 35,
  confirmingExit: false,
  loading: false,
  error: null,
  categoryWarning: null,
};

describe('MimicaScreen — Testes de Tela com Mocks de ViewModel (UC03)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/mimica.tsx', () => {
    expect(MimicaRoute).toBe(MimicaScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(mimicaVmModule, 'useMimicaViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<MimicaScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Preparando a Arena de Mímica...')
    ).toBe(true);
  });

  it('deve renderizar o estado de erro semântico e permitir tentar novamente', () => {
    const actions = createMockActions();
    jest
      .spyOn(mimicaVmModule, 'useMimicaViewModel')
      .mockReturnValue([
        { ...baseState, error: 'Falha ao carregar banco de palavras.' },
        actions,
      ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<MimicaScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Falha ao carregar banco de palavras.')
    ).toBe(true);

    const retryBtn = tree.root.findByProps({ accessibilityLabel: 'Tentar Novamente' } as any);
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o estado vazio quando houver menos de 2 equipes cadastradas', () => {
    const actions = createMockActions();
    jest
      .spyOn(mimicaVmModule, 'useMimicaViewModel')
      .mockReturnValue([{ ...baseState, teams: [] }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<MimicaScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Equipes Insuficientes')).toBe(true);
  });

  it('deve renderizar as fases pass-turn, playing, turn-summary, finished e banner de confirmação de saída', () => {
    const actions = createMockActions();
    const spy = jest.spyOn(mimicaVmModule, 'useMimicaViewModel');

    spy.mockReturnValue([{ ...baseState, phase: 'pass-turn', confirmingExit: true }, actions]);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<MimicaScreen />);
    });

    const readyBtn = tree.root.findByProps({ accessibilityLabel: 'Estou Pronto!' } as any);
    act(() => {
      readyBtn.props.onPress();
    });
    expect(actions.handleStartTurn).toHaveBeenCalledTimes(1);

    const biblicoChip = tree.root.findByProps({ accessibilityLabel: 'Pacote Bíblico' } as any);
    act(() => {
      biblicoChip.props.onPress();
    });
    expect(actions.handleToggleCategory).toHaveBeenCalledWith('Bíblico');

    spy.mockReturnValue([{ ...baseState, phase: 'playing', wordVisible: true }, actions]);
    act(() => {
      tree.update(<MimicaScreen />);
    });
    const hitBtn = tree.root.findByProps({ accessibilityLabel: 'Acertaram! (+20 pts)' } as any);
    const skipBtn = tree.root.findByProps({ accessibilityLabel: 'Pular (-5 pts)' } as any);
    act(() => {
      hitBtn.props.onPress();
      skipBtn.props.onPress();
    });
    expect(actions.handleHit).toHaveBeenCalledTimes(1);
    expect(actions.handleSkip).toHaveBeenCalledTimes(1);

    spy.mockReturnValue([{ ...baseState, phase: 'turn-summary' }, actions]);
    act(() => {
      tree.update(<MimicaScreen />);
    });
    const nextBtn = tree.root.findByProps({ accessibilityLabel: 'Próxima Equipe' } as any);
    act(() => {
      nextBtn.props.onPress();
    });
    expect(actions.handleNextTurn).toHaveBeenCalledTimes(1);

    spy.mockReturnValue([{ ...baseState, phase: 'finished' }, actions]);
    act(() => {
      tree.update(<MimicaScreen />);
    });
    const scoreboardBtn = tree.root.findByProps({
      accessibilityLabel: 'Ir para o Placar Final',
    } as any);
    act(() => {
      scoreboardBtn.props.onPress();
    });
    expect(actions.handleGoToScoreboard).toHaveBeenCalledTimes(1);
  });

  it('deve exibir os Parâmetros da Partida só no 1º turno e repassar a escolha (RF29)', () => {
    const actions = createMockActions();
    const spy = jest
      .spyOn(mimicaVmModule, 'useMimicaViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<MimicaScreen />);
    });

    const chip90 = tree.root.findAllByProps({ accessibilityLabel: '90 segundos por turno' })[0];
    const chip5 = tree.root.findAllByProps({ accessibilityLabel: '5 rodadas' })[0];
    act(() => {
      chip90.props.onPress();
      chip5.props.onPress();
    });
    expect(actions.handleSelectDuration).toHaveBeenCalledWith(90);
    expect(actions.handleSelectRounds).toHaveBeenCalledWith(5);

    spy.mockReturnValue([{ ...baseState, currentTeamIndex: 1 }, actions]);
    act(() => {
      tree.update(<MimicaScreen />);
    });
    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Parâmetros da Partida')).toBe(false);
  });

  it('deve mostrar "Ver Resultado" no resumo do último turno', () => {
    const actions = createMockActions();
    jest
      .spyOn(mimicaVmModule, 'useMimicaViewModel')
      .mockReturnValue([{ ...baseState, phase: 'turn-summary', isLastTurn: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<MimicaScreen />);
    });

    const resultBtn = tree.root.findByProps({ accessibilityLabel: 'Ver Resultado' });
    act(() => {
      resultBtn.props.onPress();
    });
    expect(actions.handleNextTurn).toHaveBeenCalledTimes(1);
  });
});
