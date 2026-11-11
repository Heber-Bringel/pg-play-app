import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AdedonhaRoute from '@/app/adedonha';
import type { AdedonhaRoom } from '@/model/entities/multiplayerSession';
import AdedonhaScreen from '@/view/adedonha';
import * as adedonhaVmModule from '@/viewmodel/useAdedonhaViewModel';
import type {
  AdedonhaActions,
  AdedonhaState,
} from '@/viewmodel/useAdedonhaViewModel';

const createMockActions = (): AdedonhaActions => ({
  handleAddColumn: jest.fn(async () => true),
  handleRemoveColumn: jest.fn(async () => {}),
  handleUpdateConfig: jest.fn(async () => {}),
  handleSpinRoulette: jest.fn(async () => {}),
  handleChangeAnswer: jest.fn(),
  handleTriggerAdedonha: jest.fn(async () => {}),
  handleTimeOut: jest.fn(async () => {}),
  handleRaiseDoubt: jest.fn(async () => {}),
  handleJudgeSubmission: jest.fn(async () => {}),
  handleAdvanceTallyColumn: jest.fn(async () => {}),
  handleAdvanceToNextRound: jest.fn(async () => {}),
  handleGoToScoreboard: jest.fn(),
  handleExitArena: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseRoom: AdedonhaRoom = {
  id: 'room-1',
  code: 'PG2026',
  gameType: 'adedonha',
  hostId: 'player-host',
  phase: 'lobby',
  config: {
    columns: ['Personagem Bíblico', 'Livro da Bíblia'],
    roundDurationSeconds: 90,
    totalRounds: 5,
    excludeHardLetters: true,
  },
  currentRound: 1,
  currentLetter: 'D',
  usedLetters: ['A'],
  currentTallyColumnIndex: 0,
  stopTriggeredBy: 'Líder do PG',
  players: [
    {
      id: 'player-host',
      nickname: 'Líder do PG',
      isHost: true,
      score: 20,
      stopCount: 1,
      uniqueAnswersCount: 2,
    },
    {
      id: 'player-2',
      nickname: 'Ana',
      isHost: false,
      score: 10,
      stopCount: 0,
      uniqueAnswersCount: 1,
    },
  ],
  submissions: [
    {
      id: 'sub-1',
      roomId: 'room-1',
      roundNumber: 1,
      playerId: 'player-host',
      playerNickname: 'Líder do PG',
      columnName: 'Personagem Bíblico',
      answerText: 'Débora',
      status: 'unique',
      doubtCount: 1,
      points: 10,
    },
  ],
};

const baseState: AdedonhaState = {
  room: baseRoom,
  loading: false,
  error: null,
  suggestedColumns: ['Personagem Bíblico', 'Livro da Bíblia'],
  availableLetters: ['B', 'C', 'D'],
  answers: {
    'Personagem Bíblico': 'Débora',
    'Livro da Bíblia': 'Daniel',
  },
  fieldErrors: {
    'Personagem Bíblico': null,
    'Livro da Bíblia': null,
  },
  canTriggerAdedonha: true,
  secondsRemaining: 45,
  currentTallyColumnName: 'Personagem Bíblico',
  currentColumnSubmissions: baseRoom.submissions,
  rankedPlayers: baseRoom.players,
  awards: {
    generalChampion: baseRoom.players[0],
    fastestHand: baseRoom.players[0],
    rareVocabulary: baseRoom.players[0],
  },
};

describe('AdedonhaScreen — Testes de Tela com Mocks de ViewModel (UC08)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/adedonha.tsx', () => {
    expect(AdedonhaRoute).toBe(AdedonhaScreen);
  });

  it('deve renderizar os estados de carregamento (loading), erro e vazio', () => {
    const actions = createMockActions();
    jest
      .spyOn(adedonhaVmModule, 'useAdedonhaViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let loadingTree!: renderer.ReactTestRenderer;
    act(() => {
      loadingTree = renderer.create(<AdedonhaScreen />);
    });
    const loadingTexts = loadingTree.root.findAllByType('Text' as any);
    expect(
      loadingTexts.some(
        (t) => t.props.children === 'Conectando à Sala da Adedonha Bíblica...'
      )
    ).toBe(true);

    jest.spyOn(adedonhaVmModule, 'useAdedonhaViewModel').mockReturnValue([
      {
        ...baseState,
        room: null,
        error: 'Sem conexão com a sala multiplayer.',
      },
      actions,
    ]);

    let errorTree!: renderer.ReactTestRenderer;
    act(() => {
      errorTree = renderer.create(<AdedonhaScreen />);
    });
    const retryBtn = errorTree.root.findByProps({
      accessibilityLabel: 'Tentar Novamente',
    } as any);
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);

    jest
      .spyOn(adedonhaVmModule, 'useAdedonhaViewModel')
      .mockReturnValue([{ ...baseState, room: null, error: null }, actions]);

    let emptyTree!: renderer.ReactTestRenderer;
    act(() => {
      emptyTree = renderer.create(<AdedonhaScreen />);
    });
    const emptyTexts = emptyTree.root.findAllByType('Text' as any);
    expect(
      emptyTexts.some((t) => t.props.children === 'Nenhuma Sala Encontrada')
    ).toBe(true);
  });

  it('deve renderizar o Lobby, adicionar/remover colunas e girar a Roleta Expressiva (RF21)', async () => {
    const actions = createMockActions();
    jest
      .spyOn(adedonhaVmModule, 'useAdedonhaViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<AdedonhaScreen />);
    });

    const addBtn = tree.root.findByProps({
      accessibilityLabel: 'Adicionar Coluna',
    } as any);
    const removeBtn = tree.root.findByProps({
      accessibilityLabel: 'Remover · Personagem Bíblico',
    } as any);
    const spinBtn = tree.root.findByProps({
      accessibilityLabel: 'Girar Roleta Expressiva',
    } as any);

    await act(async () => {
      addBtn.props.onPress();
      removeBtn.props.onPress();
      spinBtn.props.onPress();
    });

    expect(actions.handleAddColumn).toHaveBeenCalledTimes(1);
    expect(actions.handleRemoveColumn).toHaveBeenCalledWith(
      'Personagem Bíblico'
    );
    expect(actions.handleSpinRoulette).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a fase de preenchimento e acionar o botão Jumbo ADEDONHA! (RF22)', () => {
    const actions = createMockActions();
    jest.spyOn(adedonhaVmModule, 'useAdedonhaViewModel').mockReturnValue([
      {
        ...baseState,
        room: { ...baseRoom, phase: 'filling' },
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<AdedonhaScreen />);
    });

    const stopBtn = tree.root.findByProps({
      accessibilityLabel: 'ADEDONHA! (Parar Rodada)',
    } as any);
    act(() => {
      stopBtn.props.onPress();
    });
    expect(actions.handleTriggerAdedonha).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a Apuração Assistida (Levantar Dúvida ✋ e Veredito do Moderador) e o Pódio Final (RF23)', () => {
    const actions = createMockActions();
    jest.spyOn(adedonhaVmModule, 'useAdedonhaViewModel').mockReturnValue([
      {
        ...baseState,
        room: { ...baseRoom, phase: 'tally' },
      },
      actions,
    ]);

    let tallyTree!: renderer.ReactTestRenderer;
    act(() => {
      tallyTree = renderer.create(<AdedonhaScreen />);
    });

    const doubtBtn = tallyTree.root.findByProps({
      accessibilityLabel: 'Levantar Dúvida ✋ · Líder do PG',
    } as any);
    const uniqueBtn = tallyTree.root.findByProps({
      accessibilityLabel: 'Validar Única (+10) · Líder do PG',
    } as any);
    const nextColBtn = tallyTree.root.findByProps({
      accessibilityLabel: 'Confirmar e Próxima Coluna',
    } as any);

    act(() => {
      doubtBtn.props.onPress();
      uniqueBtn.props.onPress();
      nextColBtn.props.onPress();
    });

    expect(actions.handleRaiseDoubt).toHaveBeenCalledWith('sub-1');
    expect(actions.handleJudgeSubmission).toHaveBeenCalledWith(
      'sub-1',
      'unique'
    );
    expect(actions.handleAdvanceTallyColumn).toHaveBeenCalledTimes(1);

    jest.spyOn(adedonhaVmModule, 'useAdedonhaViewModel').mockReturnValue([
      {
        ...baseState,
        room: { ...baseRoom, phase: 'round_summary' },
      },
      actions,
    ]);

    let summaryTree!: renderer.ReactTestRenderer;
    act(() => {
      summaryTree = renderer.create(<AdedonhaScreen />);
    });

    const nextRoundBtn = summaryTree.root.findByProps({
      accessibilityLabel: 'Girar Próxima Letra',
    } as any);
    const scoreboardBtn = summaryTree.root.findByProps({
      accessibilityLabel: 'Ir para o Placar Final',
    } as any);

    act(() => {
      nextRoundBtn.props.onPress();
      scoreboardBtn.props.onPress();
    });

    expect(actions.handleAdvanceToNextRound).toHaveBeenCalledTimes(1);
    expect(actions.handleGoToScoreboard).toHaveBeenCalledTimes(1);
  });
});
