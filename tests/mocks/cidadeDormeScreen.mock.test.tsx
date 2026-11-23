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
  version: 0,
  config: {
    narratorVoice: 'masculina',
    assassinCount: 1,
    dayDebateSeconds: 120,
    nightTurnSeconds: 15,
    revealRoleOnDeath: true,
  },
  currentRound: 1,
  phaseEndsAt: null,
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
  allyAssassinIds: [],
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
  hasSubmittedNightAction: false,
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

  it('deve renderizar loading e a etapa de entrada (Criar Sala e Entrar com PIN, sem Sala Demo Offline)', async () => {
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

    const demoBtns = entryTree.root.findAllByProps({
      accessibilityLabel: 'Entrar na Sala Demo Offline (CD2026)',
    } as any);
    expect(demoBtns).toHaveLength(0);

    // Spinner de carregamento durante conexão inicial
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([{ ...baseState, room: null, loading: true }, actions]);
    let entryLoadingTree!: renderer.ReactTestRenderer;
    act(() => {
      entryLoadingTree = renderer.create(<CidadeDormeScreen />);
    });
    expect(
      entryLoadingTree.root.findAllByType('ActivityIndicator' as any).length
    ).toBeGreaterThan(0);
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

    // Fase da Noite (Detetive com veredito de Assassino confirmado: oculta lista e botão manual de amanhecer)
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

    expect(
      nightTree.root.findAllByProps({
        accessibilityLabel: 'Concluir Noite e Amanhecer',
      } as any)
    ).toHaveLength(0);
    expect(
      nightTree.root.findAllByProps({
        accessibilityLabel: 'Investigar Suspeito',
      } as any)
    ).toHaveLength(0);
    expect(
      nightTree.root.findAllByProps({
        accessibilityLabel: 'Suspeito Confirmado: Ana é Assassino',
      } as any).length
    ).toBeGreaterThan(0);
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

  it('deve aplicar permissões estritas da RNF11 (ocultar veredito do Detetive para não-Detetives e controles do Moderador para convidados)', () => {
    const actions = createMockActions();

    // Anfitrião com papel de Cidadão NÃO pode ver o veredito do Detetive
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isCurrentPlayerHost: true,
          isNightPhase: true,
          currentPlayer: {
            ...baseRoom.players[0],
            role: 'cidadao',
          },
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

    let nonDetectiveNightTree!: renderer.ReactTestRenderer;
    act(() => {
      nonDetectiveNightTree = renderer.create(<CidadeDormeScreen />);
    });
    expect(
      nonDetectiveNightTree.root.findAllByProps({
        accessibilityLabel: 'Concluir Noite e Amanhecer',
      } as any)
    ).toHaveLength(0);
    expect(
      nonDetectiveNightTree.root.findAllByProps({
        accessibilityLabel: 'Suspeito Confirmado: Ana é Assassino',
      } as any)
    ).toHaveLength(0);

    // Convidado em day_debate não vê botão de iniciar votação
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isCurrentPlayerHost: false,
          currentPlayerId: 'cd-player-2',
          currentPlayer: baseRoom.players[1],
          room: { ...baseRoom, phase: 'day_debate' },
        },
        actions,
      ]);

    let guestDebateTree!: renderer.ReactTestRenderer;
    act(() => {
      guestDebateTree = renderer.create(<CidadeDormeScreen />);
    });
    expect(
      guestDebateTree.root.findAllByProps({
        accessibilityLabel: 'Iniciar Votação Secreta',
      } as any)
    ).toHaveLength(0);

    // Convidado em vote_result não vê botão de próxima noite
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isCurrentPlayerHost: false,
          currentPlayerId: 'cd-player-2',
          currentPlayer: baseRoom.players[1],
          room: { ...baseRoom, phase: 'vote_result' },
        },
        actions,
      ]);

    let guestVoteResultTree!: renderer.ReactTestRenderer;
    act(() => {
      guestVoteResultTree = renderer.create(<CidadeDormeScreen />);
    });
    expect(
      guestVoteResultTree.root.findAllByProps({
        accessibilityLabel: 'Iniciar Próxima Noite',
      } as any)
    ).toHaveLength(0);

    // Convidado em finished não vê botão de revanche, mas vê Trocar de Jogo
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isCurrentPlayerHost: false,
          currentPlayerId: 'cd-player-2',
          currentPlayer: baseRoom.players[1],
          room: { ...baseRoom, phase: 'finished', winner: 'cidade' },
        },
        actions,
      ]);

    let guestFinishedTree!: renderer.ReactTestRenderer;
    act(() => {
      guestFinishedTree = renderer.create(<CidadeDormeScreen />);
    });
    expect(
      guestFinishedTree.root.findAllByProps({
        accessibilityLabel: 'Jogar Novamente (Revanche)',
      } as any)
    ).toHaveLength(0);
    expect(
      guestFinishedTree.root.findAllByProps({
        accessibilityLabel: 'Trocar de Jogo',
      } as any).length
    ).toBeGreaterThan(0);
  });

  it('deve aplicar melhorias de IHC (#42, #43): cabeçalho contextual, aviso para convidados, opções numeradas sem A-D e filtragem de alvos', () => {
    const actions = createMockActions();

    // 1. Cabeçalho contextual por fase
    const phaseExpectations: Array<{
      phase: CidadeDormeRoom['phase'];
      expectedText: string;
    }> = [
      { phase: 'lobby', expectedText: 'PIN CD2026 · Lobby' },
      { phase: 'role_reveal', expectedText: 'PIN CD2026 · Revelação' },
      { phase: 'night_assassin', expectedText: 'PIN CD2026 · A Noite 1' },
      { phase: 'day_debate', expectedText: 'PIN CD2026 · O Dia 1' },
      { phase: 'finished', expectedText: 'PIN CD2026 · Fim de Jogo' },
    ];

    for (const item of phaseExpectations) {
      jest
        .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
        .mockReturnValue([
          {
            ...baseState,
            isNightPhase: item.phase.startsWith('night_'),
            room: { ...baseRoom, phase: item.phase },
          },
          actions,
        ]);
      let phaseTree!: renderer.ReactTestRenderer;
      act(() => {
        phaseTree = renderer.create(<CidadeDormeScreen />);
      });
      const texts = phaseTree.root.findAllByType('Text' as any);
      expect(texts.some((t) => t.props.children === item.expectedText)).toBe(
        true
      );
      expect(texts.some((t) => t.props.children === 'PIN CD2026 · O Dia 1')).toBe(
        item.phase === 'day_debate'
      );
    }

    // 2. Aviso claro na aba Parâmetros para convidados
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isCurrentPlayerHost: false,
          currentPlayerId: 'cd-player-2',
          currentPlayer: baseRoom.players[1],
          room: { ...baseRoom, phase: 'lobby' },
        },
        actions,
      ]);
    let guestLobbyTree!: renderer.ReactTestRenderer;
    act(() => {
      guestLobbyTree = renderer.create(<CidadeDormeScreen />);
    });
    const configTab = guestLobbyTree.root.findByProps({
      accessibilityLabel: 'Aba Configurar Parâmetros da Partida',
    } as any);
    act(() => {
      configTab.props.onPress();
    });
    const guestLobbyTexts = guestLobbyTree.root.findAllByType('Text' as any);
    expect(
      guestLobbyTexts.some(
        (t) =>
          t.props.children ===
          'Somente o moderador altera os parâmetros da sala.'
      )
    ).toBe(true);

    // 3. Noite do Assassino: exclui a si mesmo e aliados em allyAssassinIds + exibe feedback após agir
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isNightPhase: true,
          isCurrentPlayerHost: false,
          hasSubmittedNightAction: true,
          currentPlayerId: 'cd-player-2',
          currentPlayer: baseRoom.players[1],
          room: {
            ...baseRoom,
            phase: 'night_assassin',
            allyAssassinIds: ['cd-player-3'],
            players: baseRoom.players.map((p) =>
              p.id === 'cd-player-2' ? p : { ...p, role: null }
            ),
          },
        },
        actions,
      ]);
    let assassinNightTree!: renderer.ReactTestRenderer;
    act(() => {
      assassinNightTree = renderer.create(<CidadeDormeScreen />);
    });
    const nightTexts = assassinNightTree.root.findAllByType('Text' as any);
    expect(nightTexts.some((t) => t.props.children === 'Ana')).toBe(false);
    expect(nightTexts.some((t) => t.props.children === 'Lucas')).toBe(false);
    expect(nightTexts.some((t) => t.props.children === 'Líder do PG')).toBe(
      true
    );
    expect(
      nightTexts.some(
        (t) =>
          t.props.children === 'Escolha registrada — aguarde o fim do turno.'
      )
    ).toBe(true);

    // 4. Votação do Dia: exclui próprio jogador, usa SelectableOptionItem sem A-D e ícones corretos
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          currentPlayerId: 'cd-player-1',
          currentPlayer: baseRoom.players[0],
          room: { ...baseRoom, phase: 'day_voting' },
        },
        actions,
      ]);
    let voteDayTree!: renderer.ReactTestRenderer;
    act(() => {
      voteDayTree = renderer.create(<CidadeDormeScreen />);
    });
    const voteTexts = voteDayTree.root.findAllByType('Text' as any);
    // Próprio jogador (Líder do PG) não aparece como candidato
    expect(voteTexts.some((t) => t.props.children === 'Líder do PG')).toBe(
      false
    );
    expect(voteTexts.some((t) => t.props.children === 'Ana')).toBe(true);
    expect(
      voteTexts.some((t) => t.props.children === 'Abster-se / Pular Voto')
    ).toBe(true);
    const voteIcons = voteDayTree.root.findAllByType(
      'MaterialCommunityIcons' as any
    );
    expect(voteIcons.some((i) => i.props.name === 'vote-outline')).toBe(true);
    expect(
      voteIcons.some((i) => i.props.name === 'hand-back-left-outline')
    ).toBe(true);
  });
});
