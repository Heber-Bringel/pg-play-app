import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as ReactNative from 'react-native';
import ForcaRoute from '@/app/forca';
import { LetterKey } from '@/view/components/letterKey';
import ForcaScreen from '@/view/forca';
import * as forcaVmModule from '@/viewmodel/useForcaViewModel';
import type { ForcaActions, ForcaState } from '@/viewmodel/useForcaViewModel';

const createMockActions = (): ForcaActions => ({
  handleStartTurn: jest.fn(),
  handleGuessLetter: jest.fn(async () => {}),
  handleResetWord: jest.fn(),
  handleNextWord: jest.fn(),
  handleSelectAttempts: jest.fn(),
  handleSelectRounds: jest.fn(),
  handleToggleCategory: jest.fn(async () => {}),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn(),
  handleGoToScoreboard: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: ForcaState = {
  phase: 'pass-turn',
  teams: [
    { id: 't1', name: 'Tribo de Judá', score: 30 },
    { id: 't2', name: 'Leões da Fé', score: 10 },
  ],
  currentTeamIndex: 0,
  currentTeam: { id: 't1', name: 'Tribo de Judá', score: 30 },
  currentRound: 1,
  totalRounds: 3,
  maxAttempts: 5,
  remainingAttempts: 5,
  selectedCategories: ['Bíblico'],
  currentPuzzle: {
    id: 'f1',
    word: 'COMUNHÃO',
    hint: 'Propósito essencial de um Pequeno Grupo (PG)',
    category: 'Bíblico',
  },
  remainingPuzzlesCount: 10,
  guessedLetters: ['A', 'C'],
  maskedWord: [
    { original: 'C', normalized: 'C', revealed: true, isSpecial: false },
    { original: 'O', normalized: 'O', revealed: false, isSpecial: false },
    { original: 'M', normalized: 'M', revealed: false, isSpecial: false },
    { original: 'U', normalized: 'U', revealed: false, isSpecial: false },
    { original: 'N', normalized: 'N', revealed: false, isSpecial: false },
    { original: 'H', normalized: 'H', revealed: false, isSpecial: false },
    { original: 'Ã', normalized: 'A', revealed: true, isSpecial: false },
    { original: 'O', normalized: 'O', revealed: false, isSpecial: false },
  ],
  wordWon: false,
  wordLost: false,
  earnedPoints: 0,
  bonusPoints: 0,
  confirmingExit: false,
  loading: false,
  error: null,
};

describe('ForcaScreen — Testes de Tela com Mocks de ViewModel (UC05)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/forca.tsx', () => {
    expect(ForcaRoute).toBe(ForcaScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(forcaVmModule, 'useForcaViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ForcaScreen />);
    });

    const root = tree.root.findByProps({
      accessibilityLabel: 'Carregando Arena do Jogo da Forca',
    } as any);
    expect(root).toBeDefined();
  });

  it('deve renderizar o estado de erro e acionar handleRetry', () => {
    const actions = createMockActions();
    jest
      .spyOn(forcaVmModule, 'useForcaViewModel')
      .mockReturnValue([{ ...baseState, error: 'Falha de conexão com os temas.' }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ForcaScreen />);
    });

    const retryBtn = tree.root.findByProps({
      accessibilityLabel: 'Tentar Novamente',
    } as any);
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o estado de equipes insuficientes quando houver menos de 2 equipes', () => {
    const actions = createMockActions();
    jest
      .spyOn(forcaVmModule, 'useForcaViewModel')
      .mockReturnValue([{ ...baseState, teams: [] }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ForcaScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Equipes Insuficientes')).toBe(true);
  });

  it('deve renderizar as fases pass-turn, playing, word-result, finished e ações de jogo', () => {
    const actions = createMockActions();
    const spy = jest.spyOn(forcaVmModule, 'useForcaViewModel');

    // 1. pass-turn
    spy.mockReturnValue([{ ...baseState, phase: 'pass-turn', confirmingExit: true }, actions]);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ForcaScreen />);
    });

    const readyBtn = tree.root.findByProps({ accessibilityLabel: 'Estou Pronto!' } as any);
    act(() => {
      readyBtn.props.onPress();
    });
    expect(actions.handleStartTurn).toHaveBeenCalledTimes(1);

    // 2. playing com teclado e botão Reiniciar Palavra
    spy.mockReturnValue([{ ...baseState, phase: 'playing' }, actions]);
    act(() => {
      tree.update(<ForcaScreen />);
    });

    const resetBtn = tree.root.findByProps({ accessibilityLabel: 'Reiniciar Palavra' } as any);
    act(() => {
      resetBtn.props.onPress();
    });
    expect(actions.handleResetWord).toHaveBeenCalledTimes(1);

    // 3. word-result vitória
    spy.mockReturnValue([
      { ...baseState, phase: 'word-result', wordWon: true, earnedPoints: 40, bonusPoints: 10 },
      actions,
    ]);
    act(() => {
      tree.update(<ForcaScreen />);
    });

    const nextWordBtn = tree.root.findByProps({ accessibilityLabel: 'Próxima Palavra' } as any);
    act(() => {
      nextWordBtn.props.onPress();
    });
    expect(actions.handleNextWord).toHaveBeenCalledTimes(1);

    // 4. finished
    spy.mockReturnValue([{ ...baseState, phase: 'finished' }, actions]);
    act(() => {
      tree.update(<ForcaScreen />);
    });

    const scoreboardBtn = tree.root.findByProps({
      accessibilityLabel: 'Ir para o Placar Final',
    } as any);
    act(() => {
      scoreboardBtn.props.onPress();
    });
    expect(actions.handleGoToScoreboard).toHaveBeenCalledTimes(1);
  });

  it('deve calcular a quantidade de teclas da row responsivamente usando useWindowDimensions', () => {
    const actions = createMockActions();
    jest.spyOn(forcaVmModule, 'useForcaViewModel').mockReturnValue([
      {
        ...baseState,
        phase: 'playing',
        currentPuzzle: { id: 'f1', word: 'TESTE', hint: 'Dica', category: 'Bíblico' },
        guessedLetters: [],
        maskedWord: [
          { original: 'T', normalized: 'T', revealed: false, isSpecial: false },
          { original: 'E', normalized: 'E', revealed: false, isSpecial: false },
        ],
      },
      actions,
    ]);

    // Teste com largura padrão (360)
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ForcaScreen />);
    });
    const keys = tree.root.findAllByType(LetterKey);
    expect(keys.length).toBe(26);

    // Teste com largura maior (tablet - 768)
    const dimSpy = jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 768,
      height: 1024,
      scale: 1,
      fontScale: 1,
    });

    act(() => {
      tree.update(<ForcaScreen />);
    });
    const tabletKeys = tree.root.findAllByType(LetterKey);
    expect(tabletKeys.length).toBe(26);

    dimSpy.mockRestore();
  });
});
