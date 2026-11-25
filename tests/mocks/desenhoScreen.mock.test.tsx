import React from 'react';
import renderer, { act } from 'react-test-renderer';
import DesenhoRoute from '@/app/desenho';
import DesenhoScreen from '@/view/desenho';
import * as desenhoVmModule from '@/viewmodel/useDesenhoViewModel';
import type { DesenhoActions, DesenhoState } from '@/viewmodel/useDesenhoViewModel';

const createMockActions = (): DesenhoActions => ({
  handleSetReduceMotion: jest.fn(),
  handleStartTurn: jest.fn(),
  handleToggleWordVisibility: jest.fn(),
  handleAddStroke: jest.fn(),
  handleSelectColor: jest.fn(),
  handleSelectWidth: jest.fn(),
  handleUndoStroke: jest.fn(),
  handleClearCanvas: jest.fn(),
  handleHit: jest.fn(async () => {}),
  handleSkip: jest.fn(async () => {}),
  handleTick: jest.fn(),
  handleNextTurn: jest.fn(),
  handleSelectDuration: jest.fn(async () => {}),
  handleSelectRounds: jest.fn(async () => {}),
  handleToggleCategory: jest.fn(async () => {}),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn(),
  handleGoToScoreboard: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: DesenhoState = {
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
  turnDurationSeconds: 90,
  secondsRemaining: 90,
  selectedCategories: ['Bíblico', 'Animais'],
  currentCard: { id: 'd1', word: 'Arca de Noé', category: 'Bíblico', points: 20 },
  lastTurnCard: { id: 'd2', word: 'Girafa', category: 'Animais', points: 20 },
  remainingCardsCount: 10,
  wordVisible: true,
  strokes: [],
  selectedColor: 'ink',
  selectedWidth: 'thin',
  turnHits: 2,
  turnSkips: 1,
  turnPointsDelta: 35,
  confirmingExit: false,
  loading: false,
  error: null,
  categoryWarning: null,
};

describe('DesenhoScreen — Testes de Tela com Mocks de ViewModel (UC12)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/desenho.tsx', () => {
    expect(DesenhoRoute).toBe(DesenhoScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(desenhoVmModule, 'useDesenhoViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<DesenhoScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Preparando a Arena de Desenho Relâmpago...')
    ).toBe(true);
  });

  it('deve renderizar o estado de erro semântico e permitir tentar novamente', () => {
    const actions = createMockActions();
    jest
      .spyOn(desenhoVmModule, 'useDesenhoViewModel')
      .mockReturnValue([
        { ...baseState, error: 'Falha ao carregar cartas desenháveis.' },
        actions,
      ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<DesenhoScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Falha ao carregar cartas desenháveis.')
    ).toBe(true);

    const retryBtn = tree.root.findByProps({ accessibilityLabel: 'Tentar Novamente' });
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar estado orientativo quando houver menos de 2 equipes cadastradas', () => {
    const actions = createMockActions();
    jest
      .spyOn(desenhoVmModule, 'useDesenhoViewModel')
      .mockReturnValue([{ ...baseState, teams: [{ id: 't1', name: 'Só Uma', score: 0 }] }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<DesenhoScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Equipes Insuficientes')).toBe(true);
  });

  it('deve renderizar pass-turn, drawing, turn-summary e finished acionando todas as ações', () => {
    const actions = createMockActions();
    const spy = jest.spyOn(desenhoVmModule, 'useDesenhoViewModel');

    spy.mockReturnValue([baseState, actions]);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<DesenhoScreen />);
    });

    const chip120 = tree.root.findAllByProps({ accessibilityLabel: '120 segundos por turno' })[0];
    const chip2 = tree.root.findAllByProps({ accessibilityLabel: '2 rodadas' })[0];
    const packAnimais = tree.root.findByProps({ accessibilityLabel: 'Pacote Animais' });
    const readyBtn = tree.root.findByProps({ accessibilityLabel: 'Estou Pronto!' });
    act(() => {
      chip120.props.onPress();
      chip2.props.onPress();
      packAnimais.props.onPress();
      readyBtn.props.onPress();
    });
    expect(actions.handleSelectDuration).toHaveBeenCalledWith(120);
    expect(actions.handleSelectRounds).toHaveBeenCalledWith(2);
    expect(actions.handleToggleCategory).toHaveBeenCalledWith('Animais');
    expect(actions.handleStartTurn).toHaveBeenCalledTimes(1);

    // Fase drawing com palavra visível e oculta + regra de honra
    spy.mockReturnValue([{ ...baseState, phase: 'drawing', wordVisible: true }, actions]);
    act(() => {
      tree.update(<DesenhoScreen />);
    });
    const drawingTexts = tree.root.findAllByType('Text' as any);
    expect(drawingTexts.some((t) => t.props.children === 'Sem letras nem números')).toBe(true);
    expect(drawingTexts.some((t) => t.props.children === 'Arca de Noé')).toBe(true);

    const hideBtn = tree.root.findByProps({ accessibilityLabel: 'Esconder do Grupo' });
    const hitBtn = tree.root.findByProps({ accessibilityLabel: 'Acertaram! (+20 pts)' });
    const skipBtn = tree.root.findByProps({ accessibilityLabel: 'Pular (-5 pts)' });
    act(() => {
      hideBtn.props.onPress();
      hitBtn.props.onPress();
      skipBtn.props.onPress();
    });
    expect(actions.handleToggleWordVisibility).toHaveBeenCalledTimes(1);
    expect(actions.handleHit).toHaveBeenCalledTimes(1);
    expect(actions.handleSkip).toHaveBeenCalledTimes(1);

    // Palavra oculta exibe "Mostrar Palavra"
    spy.mockReturnValue([{ ...baseState, phase: 'drawing', wordVisible: false }, actions]);
    act(() => {
      tree.update(<DesenhoScreen />);
    });
    expect(tree.root.findByProps({ accessibilityLabel: 'Mostrar Palavra' })).toBeTruthy();

    // Fase turn-summary revela última palavra em andamento e mostra "Ver Resumo Final" no último turno
    spy.mockReturnValue([{ ...baseState, phase: 'turn-summary', isLastTurn: true }, actions]);
    act(() => {
      tree.update(<DesenhoScreen />);
    });
    const summaryTexts = tree.root.findAllByType('Text' as any);
    expect(
      summaryTexts.some(
        (t) =>
          typeof t.props.children === 'string' &&
          t.props.children.includes('Última palavra: Girafa')
      )
    ).toBe(true);
    const nextBtn = tree.root.findByProps({ accessibilityLabel: 'Ver Resumo Final' });
    act(() => {
      nextBtn.props.onPress();
    });
    expect(actions.handleNextTurn).toHaveBeenCalledTimes(1);

    // Fase finished
    spy.mockReturnValue([{ ...baseState, phase: 'finished' }, actions]);
    act(() => {
      tree.update(<DesenhoScreen />);
    });
    const scoreboardBtn = tree.root.findByProps({
      accessibilityLabel: 'Ir para o Placar Final',
    });
    act(() => {
      scoreboardBtn.props.onPress();
    });
    expect(actions.handleGoToScoreboard).toHaveBeenCalledTimes(1);
  });
});
