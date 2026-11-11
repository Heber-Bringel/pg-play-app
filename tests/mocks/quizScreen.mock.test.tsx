import React from 'react';
import renderer, { act } from 'react-test-renderer';
import QuizRoute from '@/app/quiz';
import QuizScreen from '@/view/quiz';
import * as quizVmModule from '@/viewmodel/useQuizViewModel';
import type { QuizActions, QuizState } from '@/viewmodel/useQuizViewModel';

const createMockActions = (): QuizActions => ({
  handleStartTurn: jest.fn(),
  handleSelectOption: jest.fn(async () => {}),
  handleTick: jest.fn(),
  handleNextQuestion: jest.fn(),
  handleSelectDuration: jest.fn(),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn(),
  handleGoToScoreboard: jest.fn(),
  handleGoToTeams: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: QuizState = {
  phase: 'pass-turn',
  teams: [
    { id: 't1', name: 'Tribo de Judá', score: 0 },
    { id: 't2', name: 'Leões da Fé', score: 0 },
  ],
  currentTeamIndex: 0,
  currentTeam: { id: 't1', name: 'Tribo de Judá', score: 0 },
  currentQuestionIndex: 0,
  totalQuestions: 10,
  currentQuestion: {
    id: 'q1',
    question: 'Quem construiu a arca sob instrução de Deus?',
    category: 'Bíblico',
    correctKey: 'B',
    explanation: 'Noé construiu a arca conforme narrado em Gênesis 6.',
    options: [
      { key: 'A', text: 'Moisés' },
      { key: 'B', text: 'Noé' },
      { key: 'C', text: 'Abraão' },
      { key: 'D', text: 'Davi' },
    ],
  },
  selectedOptionKey: null,
  isCorrect: null,
  secondsRemaining: 20,
  turnDurationSeconds: 20,
  turnScoreDelta: 0,
  confirmingExit: false,
  loading: false,
  error: null,
};

describe('QuizScreen — Testes de Tela com Mocks de ViewModel (UC04)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/quiz.tsx', () => {
    expect(QuizRoute).toBe(QuizScreen);
  });

  it('deve renderizar o estado de carregamento (loading)', () => {
    const actions = createMockActions();
    jest
      .spyOn(quizVmModule, 'useQuizViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Carregando perguntas do Quiz Relâmpago...')
    ).toBe(true);
  });

  it('deve renderizar erro e oferecer botão para configurar equipes quando houver menos de 2 equipes', () => {
    const actions = createMockActions();
    jest.spyOn(quizVmModule, 'useQuizViewModel').mockReturnValue([
      {
        ...baseState,
        teams: [],
        error: 'São necessárias pelo menos 2 equipes para jogar o Quiz Relâmpago.',
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const configBtn = tree.root.findByProps({
      accessibilityLabel: 'Configurar Equipes',
    });
    expect(configBtn).toBeDefined();

    act(() => {
      configBtn.props.onPress();
    });
    expect(actions.handleGoToTeams).toHaveBeenCalled();
  });

  it('deve renderizar a fase de confirmação de saída (confirmingExit)', () => {
    const actions = createMockActions();
    jest
      .spyOn(quizVmModule, 'useQuizViewModel')
      .mockReturnValue([{ ...baseState, confirmingExit: true }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const stayBtn = tree.root.findByProps({
      accessibilityLabel: 'Continuar Jogando',
    });
    expect(stayBtn).toBeDefined();

    act(() => {
      stayBtn.props.onPress();
    });
    expect(actions.handleCancelExit).toHaveBeenCalled();
  });

  it('deve renderizar a fase pass-turn com nome da equipe e botão Estou Pronto!', () => {
    const actions = createMockActions();
    jest
      .spyOn(quizVmModule, 'useQuizViewModel')
      .mockReturnValue([{ ...baseState, phase: 'pass-turn' }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(texts.some((t) => t.props.children === 'Tribo de Judá')).toBe(true);

    const readyBtn = tree.root.findByProps({
      accessibilityLabel: 'Estou Pronto!',
    });
    act(() => {
      readyBtn.props.onPress();
    });
    expect(actions.handleStartTurn).toHaveBeenCalled();
  });

  it('deve renderizar a fase playing com as alternativas de A a D e acionar handleSelectOption', () => {
    const actions = createMockActions();
    jest
      .spyOn(quizVmModule, 'useQuizViewModel')
      .mockReturnValue([{ ...baseState, phase: 'playing' }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const optB = tree.root.findByProps({
      accessibilityLabel: 'Alternativa B: Noé',
    });
    expect(optB).toBeDefined();

    act(() => {
      optB.props.onPress();
    });
    expect(actions.handleSelectOption).toHaveBeenCalledWith('B');
  });

  it('deve renderizar a fase answered com explicação e botão Próxima Pergunta', () => {
    const actions = createMockActions();
    jest.spyOn(quizVmModule, 'useQuizViewModel').mockReturnValue([
      {
        ...baseState,
        phase: 'answered',
        selectedOptionKey: 'B',
        isCorrect: true,
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any);
    expect(
      texts.some((t) => t.props.children === 'Resposta Correta! (+10 pts)')
    ).toBe(true);

    const nextBtn = tree.root.findByProps({
      accessibilityLabel: 'Próxima Pergunta',
    });
    act(() => {
      nextBtn.props.onPress();
    });
    expect(actions.handleNextQuestion).toHaveBeenCalled();
  });

  it('deve renderizar a fase finished com botão para ir ao placar final', () => {
    const actions = createMockActions();
    jest
      .spyOn(quizVmModule, 'useQuizViewModel')
      .mockReturnValue([{ ...baseState, phase: 'finished' }, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<QuizScreen />);
    });

    const scoreboardBtn = tree.root.findByProps({
      accessibilityLabel: 'Ir para o Placar Final',
    });
    act(() => {
      scoreboardBtn.props.onPress();
    });
    expect(actions.handleGoToScoreboard).toHaveBeenCalled();
  });
});
