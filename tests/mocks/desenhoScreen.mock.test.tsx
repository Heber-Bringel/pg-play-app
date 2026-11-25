import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import DesenhoRoute from '@/app/desenho';
import type { DesenhoRoom } from '@/model/entities/multiplayerSession';
import { DesenhoScreen } from '@/view/desenho';
import type { DesenhoActions, DesenhoState } from '@/viewmodel/useDesenhoViewModel';

const mockUseDesenhoViewModel = jest.fn();

jest.mock('@/viewmodel/useDesenhoViewModel', () => ({
  ALL_DESENHO_CATEGORIES: [
    'Bíblico',
    'Animais',
    'Objetos',
    'Comidas',
    'Lugares e Natureza',
  ],
  useDesenhoViewModel: () => mockUseDesenhoViewModel(),
}));

const createMockActions = (): DesenhoActions => ({
  handleSetReduceMotion: jest.fn(),
  handleCreateRoom: jest.fn().mockResolvedValue(true),
  handleJoinRoom: jest.fn().mockResolvedValue(true),
  handleJoinDemoRoom: jest.fn().mockResolvedValue(true),
  handleSelectDuration: jest.fn().mockResolvedValue(undefined),
  handleSelectRounds: jest.fn().mockResolvedValue(undefined),
  handleToggleCategory: jest.fn().mockResolvedValue(undefined),
  handleStartMatch: jest.fn().mockResolvedValue(undefined),
  handleSelectTool: jest.fn(),
  handleSelectFillMode: jest.fn(),
  handleSelectColor: jest.fn(),
  handleSelectWidth: jest.fn(),
  handleCompleteElement: jest.fn().mockResolvedValue(undefined),
  handleUndoElement: jest.fn().mockResolvedValue(undefined),
  handleClearCanvas: jest.fn().mockResolvedValue(undefined),
  handlePeekWord: jest.fn(),
  handleChangeGuessDraft: jest.fn(),
  handleSubmitGuess: jest.fn().mockResolvedValue(undefined),
  handleTick: jest.fn(),
  handleFinishTurn: jest.fn().mockResolvedValue(undefined),
  handleAdvanceTurn: jest.fn().mockResolvedValue(undefined),
  handleRestartLobby: jest.fn().mockResolvedValue(undefined),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn().mockResolvedValue(undefined),
  handleRetry: jest.fn().mockResolvedValue(undefined),
});

const createMockRoom = (overrides: Partial<DesenhoRoom> = {}): DesenhoRoom => ({
  id: 'room-1',
  code: 'DR2026',
  gameType: 'desenho',
  hostId: 'p1',
  phase: 'lobby',
  version: 1,
  phaseEndsAt: null,
  config: {
    turnDurationSeconds: 90,
    totalRounds: 2,
    categories: ['Bíblico', 'Animais', 'Objetos', 'Comidas', 'Lugares e Natureza'],
  },
  currentRound: 1,
  drawerOrder: ['p1', 'p2'],
  currentDrawerIndex: 0,
  currentDrawerId: 'p1',
  currentCardCategory: 'Bíblico',
  currentSecretWord: 'Arca de Noé',
  usedCardIds: ['desenho-1'],
  elements: [],
  guesses: [],
  players: [
    {
      id: 'p1',
      nickname: 'Roger',
      isHost: true,
      score: 15,
      drawingScore: 15,
      firstGuessCount: 0,
      hasGuessedCurrentTurn: false,
    },
    {
      id: 'p2',
      nickname: 'Ana',
      isHost: false,
      score: 20,
      drawingScore: 0,
      firstGuessCount: 1,
      hasGuessedCurrentTurn: false,
    },
  ],
  ...overrides,
});

const createMockState = (overrides: Partial<DesenhoState> = {}): DesenhoState => ({
  room: null,
  currentPlayerId: 'p1',
  currentPlayer: null,
  currentDrawer: null,
  isCurrentPlayerHost: true,
  isCurrentPlayerDrawer: true,
  isRealtimeEnabled: false,
  reduceMotion: false,
  secondsRemaining: 90,
  themeBannerSecondsLeft: 0,
  isThemeBannerVisible: false,
  isPeekingTheme: false,
  isCanvasExpanded: false,
  selectedTool: 'freehand',
  selectedFillMode: 'stroke',
  selectedColor: 'ink',
  selectedWidth: 'thin',
  guessDraft: '',
  guessFeedback: null,
  rankedPlayers: [],
  awards: { generalChampion: null, bestArtist: null, eagleEye: null },
  confirmingExit: false,
  loading: false,
  error: null,
  categoryWarning: null,
  ...overrides,
});

describe('DesenhoScreen — Testes de Tela com Mock (UC12 Multiplayer)', () => {
  beforeEach(() => {
    mockUseDesenhoViewModel.mockReset();
  });

  it('deve reexportar DesenhoScreen pela rota fina src/app/desenho.tsx', () => {
    expect(DesenhoRoute).toBe(DesenhoScreen);
  });

  it('deve renderizar estado loading e tela inicial de entrada na sala', async () => {
    const actions = createMockActions();
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({ loading: true }),
      actions,
    ]);
    const loadingScreen = await render(<DesenhoScreen />);
    expect(
      loadingScreen.getByText('Preparando a Sala de Desenho Relâmpago...')
    ).toBeTruthy();

    mockUseDesenhoViewModel.mockReturnValue([createMockState(), actions]);
    const entryScreen = await render(<DesenhoScreen />);
    expect(entryScreen.getByText('Criar Nova Sala')).toBeTruthy();
    await fireEvent.press(entryScreen.getByText('Abrir Sala de Demonstração'));
    expect(actions.handleJoinDemoRoom).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o Lobby do Anfitrião e iniciar a partida', async () => {
    const actions = createMockActions();
    const room = createMockRoom({ phase: 'lobby' });
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({
        room,
        currentPlayer: room.players[0],
        isCurrentPlayerHost: true,
      }),
      actions,
    ]);

    const screen = await render(<DesenhoScreen />);
    expect(screen.getByText('Sala DR2026 — Lobby')).toBeTruthy();
    await fireEvent.press(screen.getByText('Começar Partida!'));
    expect(actions.handleStartMatch).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar visão do Desenhista com tema 5s, depois canvas expandido e botão Espiar palavra', async () => {
    const actions = createMockActions();
    const room = createMockRoom({ phase: 'drawing' });

    // Nos 5s iniciais: tema visível
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({
        room,
        currentPlayer: room.players[0],
        currentDrawer: room.players[0],
        isCurrentPlayerDrawer: true,
        isThemeBannerVisible: true,
        isPeekingTheme: false,
        themeBannerSecondsLeft: 4,
        isCanvasExpanded: false,
      }),
      actions,
    ]);
    const initialScreen = await render(<DesenhoScreen />);
    expect(initialScreen.getByTestId('desenho-initial-theme-card')).toBeTruthy();
    expect(initialScreen.getByText('Arca de Noé')).toBeTruthy();
    expect(initialScreen.getByText('Some em 4s')).toBeTruthy();

    // Após 5s: tema some, canvas expandido e botão Espiar palavra disponível
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({
        room,
        currentPlayer: room.players[0],
        currentDrawer: room.players[0],
        isCurrentPlayerDrawer: true,
        isThemeBannerVisible: false,
        isCanvasExpanded: true,
      }),
      actions,
    ]);
    const expandedScreen = await render(<DesenhoScreen />);
    expect(expandedScreen.queryByTestId('desenho-initial-theme-card')).toBeNull();
    await fireEvent.press(expandedScreen.getByText('Espiar palavra'));
    expect(actions.handlePeekWord).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar visão do Adivinhador sem palavra secreta e com envio de palpite', async () => {
    const actions = createMockActions();
    const room = createMockRoom({
      phase: 'drawing',
      currentSecretWord: null,
      guesses: [
        {
          id: 'g-1',
          playerId: 'p2',
          playerNickname: 'Ana',
          text: 'barco',
          isCorrect: false,
          pointsAwarded: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({
        room,
        currentPlayerId: 'p2',
        currentPlayer: room.players[1],
        currentDrawer: room.players[0],
        isCurrentPlayerHost: false,
        isCurrentPlayerDrawer: false,
        isCanvasExpanded: true,
        guessDraft: 'Arca de Noé',
      }),
      actions,
    ]);

    const screen = await render(<DesenhoScreen />);
    expect(screen.getByText('Desenhando agora: Roger')).toBeTruthy();
    expect(screen.queryByLabelText('Forma Triângulo')).toBeNull();
    await fireEvent.press(screen.getByText('Enviar Palpite'));
    expect(actions.handleSubmitGuess).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar turn_summary e pódio finished com destaques', async () => {
    const actions = createMockActions();
    const summaryRoom = createMockRoom({ phase: 'turn_summary' });
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({
        room: summaryRoom,
        currentDrawer: summaryRoom.players[0],
        rankedPlayers: [summaryRoom.players[1], summaryRoom.players[0]],
      }),
      actions,
    ]);

    const summaryScreen = await render(<DesenhoScreen />);
    expect(summaryScreen.getByText(/A palavra era: Arca de Noé/)).toBeTruthy();
    await fireEvent.press(summaryScreen.getByText('Próximo Desenhista'));
    expect(actions.handleAdvanceTurn).toHaveBeenCalledTimes(1);

    const finishedRoom = createMockRoom({ phase: 'finished' });
    mockUseDesenhoViewModel.mockReturnValue([
      createMockState({
        room: finishedRoom,
        rankedPlayers: [finishedRoom.players[1], finishedRoom.players[0]],
        awards: {
          generalChampion: finishedRoom.players[1],
          bestArtist: finishedRoom.players[0],
          eagleEye: finishedRoom.players[1],
        },
      }),
      actions,
    ]);

    const finishedScreen = await render(<DesenhoScreen />);
    expect(finishedScreen.getByText('Pódio Final — Desenho Relâmpago')).toBeTruthy();
    expect(finishedScreen.getByText('Campeão: Ana')).toBeTruthy();
    expect(finishedScreen.getByText('Melhor Artista: Roger')).toBeTruthy();
  });
});
