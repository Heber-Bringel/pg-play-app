import React from 'react';
import renderer, { act } from 'react-test-renderer';
import CidadeDormeRoute from '@/app/cidade-dorme';
import type { CidadeDormeRoom } from '@/model/entities/multiplayerSession';
import CidadeDormeScreen from '@/view/cidade-dorme';
import * as cidadeDormeVmModule from '@/viewmodel/useCidadeDormeViewModel';
import type {
  CidadeDormeActions,
  CidadeDormeState,
} from '@/viewmodel/useCidadeDormeViewModel';

const createMockActions = (): CidadeDormeActions => ({
  handleCreateRoom: jest.fn(async () => true),
  handleJoinRoom: jest.fn(async () => true),
  handleJoinDemoRoom: jest.fn(async () => true),
  handleAddPlayer: jest.fn(async () => true),
  handleRemovePlayer: jest.fn(async () => {}),
  handleUpdateConfig: jest.fn(async () => {}),
  handleStartMatch: jest.fn(async () => {}),
  handleToggleRoleVisibility: jest.fn(),
  handleConfirmRoleReady: jest.fn(async () => {}),
  handleSelectNightTarget: jest.fn(),
  handleConfirmAssassinTarget: jest.fn(async () => {}),
  handleConfirmAngelProtection: jest.fn(async () => {}),
  handleConfirmDetectiveInvestigation: jest.fn(async () => {}),
  handleAdvanceToDawn: jest.fn(async () => {}),
  handleAutoAdvanceNightTurn: jest.fn(async () => {}),
  handleStartVotingPhase: jest.fn(async () => {}),
  handleSelectVoteTarget: jest.fn(),
  handleCastVote: jest.fn(async () => {}),
  handleTallyVotes: jest.fn(async () => {}),
  handleStartNextNight: jest.fn(async () => {}),
  handleRestartMatch: jest.fn(async () => {}),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleExitArena: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseRoom: CidadeDormeRoom = {
  id: 'room-cd-1',
  code: 'CD2026',
  gameType: 'cidade-dorme',
  hostId: 'cd-player-1',
  phase: 'lobby',
  config: {
    narratorVoice: 'masculina',
    assassinCount: 1,
    dayDebateSeconds: 120,
    nightTurnSeconds: 15,
    revealRoleOnDeath: true,
  },
  currentRound: 1,
  narratorCaption: 'A cidade dorme... Todos fecham os olhos.',
  players: [
    {
      id: 'cd-player-1',
      nickname: 'Líder do PG',
      isHost: true,
      isAlive: true,
      isReady: false,
      role: 'detetive',
      hasVoted: false,
    },
    {
      id: 'cd-player-2',
      nickname: 'Ana',
      isHost: false,
      isAlive: true,
      isReady: false,
      role: 'assassino',
      hasVoted: false,
    },
    {
      id: 'cd-player-3',
      nickname: 'Lucas',
      isHost: false,
      isAlive: true,
      isReady: false,
      role: 'anjo',
      hasVoted: false,
    },
    {
      id: 'cd-player-4',
      nickname: 'Beatriz',
      isHost: false,
      isAlive: true,
      isReady: false,
      role: 'cidadao',
      hasVoted: false,
    },
    {
      id: 'cd-player-5',
      nickname: 'Pedro',
      isHost: false,
      isAlive: true,
      isReady: false,
      role: 'cidadao',
      hasVoted: false,
    },
  ],
  nightTargetId: null,
  nightProtectedId: null,
  detectiveVerdict: null,
  votesByPlayerId: {},
  dawnReport: null,
  voteReport: null,
  winner: null,
};

const baseState: CidadeDormeState = {
  room: baseRoom,
  currentPlayerId: 'cd-player-1',
  currentPlayer: baseRoom.players[0],
  currentRoleMeta: {
    role: 'detetive',
    title: 'Detetive',
    alignmentLabel: 'Cidade (Bem)',
    description: 'Investiga um suspeito durante a noite.',
    icon: 'magnify',
  },
  isCurrentPlayerHost: true,
  isRealtimeEnabled: false,
  isNightPhase: false,
  isRoleVisible: false,
  selectedNightTargetId: 'cd-player-2',
  selectedVoteTargetId: 'cd-player-2',
  secondsRemaining: 15,
  loading: false,
  error: null,
  confirmingExit: false,
};

describe('CidadeDormeScreen — Testes de Tela com Mocks de ViewModel (UC07)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/cidade-dorme.tsx', () => {
    expect(CidadeDormeRoute).toBe(CidadeDormeScreen);
  });

  it('deve renderizar loading e a etapa de entrada (Criar Sala, Entrar com PIN e Sala Demo)', async () => {
    const actions = createMockActions();
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    let loadingTree!: renderer.ReactTestRenderer;
    act(() => {
      loadingTree = renderer.create(<CidadeDormeScreen />);
    });
    const loadingTexts = loadingTree.root.findAllByType('Text' as any);
    expect(
      loadingTexts.some(
        (t) => t.props.children === 'Conectando à Sala do Cidade Dorme...'
      )
    ).toBe(true);

    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          room: null,
          error: 'Informe um apelido válido.',
        },
        actions,
      ]);

    let entryTree!: renderer.ReactTestRenderer;
    act(() => {
      entryTree = renderer.create(<CidadeDormeScreen />);
    });

    const nickInput = entryTree.root.findByProps({
      accessibilityLabel: 'Seu Apelido',
    } as any);
    act(() => {
      nickInput.props.onChangeText('Héber');
    });

    const createBtn = entryTree.root.findByProps({
      accessibilityLabel: 'Criar Sala (Moderador)',
    } as any);
    await act(async () => {
      createBtn.props.onPress();
    });
    expect(actions.handleCreateRoom).toHaveBeenCalledWith('Héber');

    const demoBtn = entryTree.root.findByProps({
      accessibilityLabel: 'Entrar na Sala Demo Offline (CD2026)',
    } as any);
    await act(async () => {
      demoBtn.props.onPress();
    });
    expect(actions.handleJoinDemoRoom).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o Lobby, selecionar a voz do Narrador e iniciar a partida (RF18, RF19)', async () => {
    const actions = createMockActions();
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([baseState, actions]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<CidadeDormeScreen />);
    });

    const voiceFemaleChip = tree.root.findByProps({
      accessibilityLabel: 'Selecionar Voz Feminina (Líder)',
    } as any);
    await act(async () => {
      voiceFemaleChip.props.onPress();
    });
    expect(actions.handleUpdateConfig).toHaveBeenCalledWith({
      narratorVoice: 'feminina',
    });

    const startBtn = tree.root.findByProps({
      accessibilityLabel: 'Distribuir Papéis e Iniciar',
    } as any);
    await act(async () => {
      startBtn.props.onPress();
    });
    expect(actions.handleStartMatch).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a Revelação Secreta de Papel e A Noite em Tema Escuro com veredito do Detetive (RF18, RF19)', async () => {
    const actions = createMockActions();
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          room: { ...baseRoom, phase: 'role_reveal' },
          isRoleVisible: true,
        },
        actions,
      ]);

    let roleTree!: renderer.ReactTestRenderer;
    act(() => {
      roleTree = renderer.create(<CidadeDormeScreen />);
    });

    const confirmRoleBtn = roleTree.root.findByProps({
      accessibilityLabel: 'Esconder e Estou Pronto',
    } as any);
    await act(async () => {
      confirmRoleBtn.props.onPress();
    });
    expect(actions.handleConfirmRoleReady).toHaveBeenCalledTimes(1);

    // Fase da Noite (Detetive com veredito de Assassino confirmado)
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isNightPhase: true,
          room: {
            ...baseRoom,
            phase: 'night_detective',
            detectiveVerdict: {
              targetPlayerId: 'cd-player-2',
              targetNickname: 'Ana',
              isAssassin: true,
              roundNumber: 1,
            },
          },
        },
        actions,
      ]);

    let nightTree!: renderer.ReactTestRenderer;
    act(() => {
      nightTree = renderer.create(<CidadeDormeScreen />);
    });

    const dawnBtn = nightTree.root.findByProps({
      accessibilityLabel: 'Concluir Noite e Amanhecer',
    } as any);
    await act(async () => {
      dawnBtn.props.onPress();
    });
    expect(actions.handleAdvanceToDawn).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar O Dia (Boletim da Manhã, Votação Secreta e Fim de Jogo com Revanche) (RF19, RF20)', async () => {
    const actions = createMockActions();
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          room: {
            ...baseRoom,
            phase: 'day_voting',
          },
        },
        actions,
      ]);

    let voteTree!: renderer.ReactTestRenderer;
    act(() => {
      voteTree = renderer.create(<CidadeDormeScreen />);
    });

    const castVoteBtn = voteTree.root.findByProps({
      accessibilityLabel: 'Confirmar Meu Voto',
    } as any);
    const tallyBtn = voteTree.root.findByProps({
      accessibilityLabel: 'Encerrar e Apurar Votos da Cidade',
    } as any);

    await act(async () => {
      castVoteBtn.props.onPress();
      tallyBtn.props.onPress();
    });
    expect(actions.handleCastVote).toHaveBeenCalledTimes(1);
    expect(actions.handleTallyVotes).toHaveBeenCalledTimes(1);

    // Tela de Fim de Jogo (Vitória da Cidade)
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          room: {
            ...baseRoom,
            phase: 'finished',
            winner: 'cidade',
          },
        },
        actions,
      ]);

    let finishedTree!: renderer.ReactTestRenderer;
    act(() => {
      finishedTree = renderer.create(<CidadeDormeScreen />);
    });

    const rematchBtn = finishedTree.root.findByProps({
      accessibilityLabel: 'Jogar Novamente (Revanche)',
    } as any);
    await act(async () => {
      rematchBtn.props.onPress();
    });
    expect(actions.handleRestartMatch).toHaveBeenCalledTimes(1);
  });
});
