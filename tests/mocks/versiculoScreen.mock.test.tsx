import React from 'react';
import renderer, { act } from 'react-test-renderer';
import VersiculoScreen from '@/view/versiculo';
import type {
  VersiculoActions,
  VersiculoState,
} from '@/viewmodel/useVersiculoViewModel';

const mockUseVersiculoViewModel = jest.fn();

jest.mock('@/viewmodel/useVersiculoViewModel', () => {
  const actual = jest.requireActual('@/viewmodel/useVersiculoViewModel');
  return {
    ...actual,
    useVersiculoViewModel: () => mockUseVersiculoViewModel(),
  };
});

const createMockActions = (): VersiculoActions => ({
  setReduceMotion: jest.fn(),
  reloadTeams: jest.fn(async () => {}),
  togglePack: jest.fn(),
  selectDuration: jest.fn(),
  selectPassagesPerTeam: jest.fn(),
  startMatch: jest.fn(async () => {}),
  startTurn: jest.fn(),
  selectBlank: jest.fn(),
  setAnswer: jest.fn(),
  revealHint: jest.fn(),
  submitAnswers: jest.fn(),
  nextTurn: jest.fn(async () => {}),
  restartMatch: jest.fn(),
  requestExit: jest.fn(),
  cancelExit: jest.fn(),
  confirmExit: jest.fn(),
  goToTeams: jest.fn(),
  goToScoreboard: jest.fn(),
});

const baseState = (): VersiculoState => ({
  reduceMotion: false,
  loading: false,
  error: null,
  phase: 'setup',
  teams: [
    { id: 't1', name: 'Alfa', score: 0 },
    { id: 't2', name: 'Beta', score: 0 },
  ],
  selectedPacks: ['Evangelhos'],
  durationSeconds: 45,
  passagesPerTeam: 3,
  passages: [],
  currentPassageIndex: 0,
  currentPassage: null,
  currentTeam: null,
  secondsRemaining: 45,
  activeBlankIndex: 1,
  answersByIndex: {},
  usedHint: false,
  hints: [],
  results: [],
  turnPoints: 0,
  sessionScoresByTeamId: {},
  exitConfirmVisible: false,
});

describe('VersiculoScreen (Mocks)', () => {
  it('renderiza estado de carregamento', () => {
    mockUseVersiculoViewModel.mockReturnValue([
      { ...baseState(), loading: true },
      createMockActions(),
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<VersiculoScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any).map((n) => n.props.children);
    expect(texts).toContain('Carregando passagens bíblicas...');
  });

  it('renderiza erro de validação e estado de preparação', () => {
    mockUseVersiculoViewModel.mockReturnValue([
      {
        ...baseState(),
        error: 'Selecione pelo menos 1 pacote de passagens bíblicas.',
      },
      createMockActions(),
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<VersiculoScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any).map((n) => n.props.children);
    expect(texts).toContain('Preparar Partida');
    expect(texts).toContain(
      'Selecione pelo menos 1 pacote de passagens bíblicas.'
    );
  });

  it('renderiza fase de jogo com opções A-D, dica 50/50 e botão Conferir', () => {
    const actions = createMockActions();
    mockUseVersiculoViewModel.mockReturnValue([
      {
        ...baseState(),
        phase: 'playing',
        currentTeam: { id: 't1', name: 'Alfa', score: 0 },
        currentPassage: {
          id: 'verse-php-4-13',
          pack: 'Cartas de Paulo',
          textWithBlanks: 'Tudo posso naquele que me ______ (1).',
          fullText: 'Tudo posso naquele que me fortalece.',
          blanks: [
            {
              index: 1,
              answer: 'fortalece',
              options: ['sustenta', 'fortalece', 'ilumina', 'acompanha'],
            },
          ],
          reference: 'Filipenses 4:13',
          translation: 'Bíblia Livre',
        },
        passages: [
          {
            id: 'verse-php-4-13',
            pack: 'Cartas de Paulo',
            textWithBlanks: 'Tudo posso naquele que me ______ (1).',
            fullText: 'Tudo posso naquele que me fortalece.',
            blanks: [
              {
                index: 1,
                answer: 'fortalece',
                options: ['sustenta', 'fortalece', 'ilumina', 'acompanha'],
              },
            ],
            reference: 'Filipenses 4:13',
            translation: 'Bíblia Livre',
          },
        ],
        usedHint: true,
        hints: [
          {
            index: 1,
            maskedWord: 'F _ _ _ _ _ _ _ _',
            eliminatedOptions: ['sustenta', 'ilumina'],
          },
        ],
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<VersiculoScreen />);
    });

    const texts = tree.root.findAllByType('Text' as any).map((n) => n.props.children);
    expect(texts).toContain('Tudo posso naquele que me ______ (1).');
    expect(texts).toContain('fortalece');

    const optionB = tree.root.findByProps({
      accessibilityLabel: 'Opção B: fortalece',
    } as any);
    act(() => {
      optionB.props.onPress();
    });
    expect(actions.setAnswer).toHaveBeenCalledWith(1, 'fortalece');

    const conferirBtn = tree.root.findByProps({
      accessibilityLabel: 'Conferir',
    } as any);
    act(() => {
      conferirBtn.props.onPress();
    });
    expect(actions.submitAnswers).toHaveBeenCalledTimes(1);
  });

  it('renderiza conferência com referência revelada e sem botão Aceitar mesmo assim', () => {
    const actions = createMockActions();
    mockUseVersiculoViewModel.mockReturnValue([
      {
        ...baseState(),
        phase: 'review',
        currentTeam: { id: 't1', name: 'Alfa', score: 0 },
        currentPassage: {
          id: 'verse-php-4-13',
          pack: 'Cartas de Paulo',
          textWithBlanks: 'Tudo posso naquele que me ______ (1).',
          fullText: 'Tudo posso naquele que me fortalece.',
          blanks: [
            {
              index: 1,
              answer: 'fortalece',
              options: ['sustenta', 'fortalece', 'ilumina', 'acompanha'],
            },
          ],
          reference: 'Filipenses 4:13',
          translation: 'Bíblia Livre',
        },
        results: [
          {
            index: 1,
            userAnswer: 'ajuda',
            expectedAnswer: 'fortalece',
            isCorrect: false,
            pointsAwarded: 0,
          },
        ],
        turnPoints: 0,
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<VersiculoScreen />);
    });

    const texts = tree.root
      .findAllByType('Text' as any)
      .map((n) => n.props.children);
    expect(texts).toContain('Filipenses 4:13 · Bíblia Livre');
    expect(texts).toContain('Palavra correta: fortalece');
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Aceitar mesmo assim' } as any)
    ).toHaveLength(0);
  });
});
