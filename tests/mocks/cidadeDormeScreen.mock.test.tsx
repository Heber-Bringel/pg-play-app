import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
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
  handleToggleNightCardVisibility: jest.fn(),
  handleHideNightCard: jest.fn(),
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
  handleSetReduceMotion: jest.fn(),
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
  isNightCardRevealed: false,
  hasSubmittedNightAction: false,
  selectedNightTargetId: 'cd-player-2',
  selectedVoteTargetId: 'cd-player-2',
  secondsRemaining: 15,
  reduceMotion: false,
  phaseTimeline: [
    { id: 'night', label: 'Noite', isActive: false, isCompleted: false },
    { id: 'dawn', label: 'Amanhecer', isActive: false, isCompleted: false },
    { id: 'debate', label: 'Debate', isActive: false, isCompleted: false },
    { id: 'voting', label: 'Votação', isActive: false, isCompleted: false },
  ],
  aliveCount: 5,
  eliminatedCount: 0,
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
          isNightCardRevealed: true,
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
          isNightCardRevealed: true,
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
    const nightTargetButtons = assassinNightTree.root
      .findAllByType('Pressable' as any)
      .map((p) => String(p.props.accessibilityLabel ?? ''));
    expect(nightTargetButtons.some((l) => l.includes(': Ana'))).toBe(false);
    expect(nightTargetButtons.some((l) => l.includes(': Lucas'))).toBe(false);
    expect(
      nightTargetButtons.some((l) => l.includes(': Líder do PG'))
    ).toBe(true);
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
    const voteTargetButtons = voteDayTree.root
      .findAllByType('Pressable' as any)
      .map((p) => String(p.props.accessibilityLabel ?? ''));
    // Próprio jogador (Líder do PG) não aparece como candidato
    expect(voteTargetButtons.some((l) => l.includes(': Líder do PG'))).toBe(
      false
    );
    expect(voteTargetButtons.some((l) => l.includes(': Ana'))).toBe(true);
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

  it('deve renderizar timeline, painel da cidade, barras de votação, paridade noturna (RNF11) e respeitar reduceMotion (RNF09) (#56)', async () => {
    const actions = createMockActions();

    // 1. Paridade noturna (RNF11): mesma linha do tempo, painel e legenda para quem age e quem dorme
    const nightTimeline = [
      { id: 'night' as const, label: 'Noite', isActive: true, isCompleted: false },
      { id: 'dawn' as const, label: 'Amanhecer', isActive: false, isCompleted: false },
      { id: 'debate' as const, label: 'Debate', isActive: false, isCompleted: false },
      { id: 'voting' as const, label: 'Votação', isActive: false, isCompleted: false },
    ];
    const nightRoom: CidadeDormeRoom = {
      ...baseRoom,
      phase: 'night_angel',
      currentRound: 2,
      players: baseRoom.players.map((p, idx) =>
        idx === 4 ? { ...p, isAlive: false } : p
      ),
    };

    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isNightPhase: true,
          currentPlayerId: 'cd-player-3',
          currentPlayer: nightRoom.players[2], // Anjo (age nesta fase)
          phaseTimeline: nightTimeline,
          aliveCount: 4,
          eliminatedCount: 1,
          room: nightRoom,
        },
        actions,
      ]);
    let angelTree!: renderer.ReactTestRenderer;
    act(() => {
      angelTree = renderer.create(<CidadeDormeScreen />);
    });

    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isNightPhase: true,
          currentPlayerId: 'cd-player-4',
          currentPlayer: nightRoom.players[3], // Cidadão (dorme nesta fase)
          phaseTimeline: nightTimeline,
          aliveCount: 4,
          eliminatedCount: 1,
          room: nightRoom,
        },
        actions,
      ]);
    let citizenTree!: renderer.ReactTestRenderer;
    act(() => {
      citizenTree = renderer.create(<CidadeDormeScreen />);
    });

    const angelTexts = angelTree.root.findAllByType('Text' as any).map((t) => t.props.children);
    const citizenTexts = citizenTree.root.findAllByType('Text' as any).map((t) => t.props.children);
    expect(angelTexts).toContain('Noite 2');
    expect(citizenTexts).toContain('Noite 2');
    expect(angelTexts).toContain('Vivos 4 · Eliminados 1');
    expect(citizenTexts).toContain('Vivos 4 · Eliminados 1');
    // Nenhum papel secreto aparece no painel da cidade durante a noite
    expect(citizenTexts).not.toContain('Assassino');
    expect(citizenTexts).not.toContain('Anjo');

    // 2. Resultado da votação: barras com contagem agregada sem revelar votantes
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          phaseTimeline: [
            { id: 'night', label: 'Noite', isActive: false, isCompleted: true },
            { id: 'dawn', label: 'Amanhecer', isActive: false, isCompleted: true },
            { id: 'debate', label: 'Debate', isActive: false, isCompleted: true },
            { id: 'voting', label: 'Votação', isActive: false, isCompleted: true },
          ],
          aliveCount: 4,
          eliminatedCount: 1,
          room: {
            ...baseRoom,
            phase: 'vote_result',
            voteReport: {
              roundNumber: 1,
              eliminatedPlayerId: 'cd-player-2',
              eliminatedNickname: 'Ana',
              eliminatedRole: 'assassino',
              tieOrSkipped: false,
              voteCounts: { 'cd-player-2': 3 },
              skipCount: 1,
            },
          },
        },
        actions,
      ]);
    let voteResultTree!: renderer.ReactTestRenderer;
    act(() => {
      voteResultTree = renderer.create(<CidadeDormeScreen />);
    });
    const voteResultTexts = voteResultTree.root.findAllByType('Text' as any);
    expect(voteResultTexts.some((t) => t.props.children === '3 voto(s)')).toBe(true);
    expect(voteResultTexts.some((t) => t.props.children === '1 voto(s)')).toBe(true);

    // 3. Fim de jogo exibe ícones específicos por papel
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
    const finishedIcons = finishedTree.root
      .findAllByType('MaterialCommunityIcons' as any)
      .map((i) => i.props.name);
    expect(finishedIcons).toContain('incognito');
    expect(finishedIcons).toContain('shield-check');
    expect(finishedIcons).toContain('magnify');
    expect(finishedIcons).toContain('home-account');

    // 4. Com reduceMotion=true, AccessibilityInfo sincroniza e animações não são disparadas
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValueOnce(true);
    const springSpy = jest.spyOn(Animated, 'spring');
    const timingSpy = jest.spyOn(Animated, 'timing');

    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          reduceMotion: true,
          isNightPhase: true,
          secondsRemaining: 5,
          room: { ...baseRoom, phase: 'night_assassin' },
        },
        actions,
      ]);

    await act(async () => {
      renderer.create(<CidadeDormeScreen />);
      await Promise.resolve();
    });

    expect(actions.handleSetReduceMotion).toHaveBeenCalledWith(true);
    expect(springSpy).not.toHaveBeenCalled();
    expect(timingSpy).not.toHaveBeenCalled();
  });

  it('deve garantir paridade visual estrita à noite antes do toque (RNF11, Issue #66)', () => {
    const actions = createMockActions();
    const nightTimeline = [
      { id: 'night' as const, label: 'Noite', isActive: true, isCompleted: false },
      { id: 'dawn' as const, label: 'Amanhecer', isActive: false, isCompleted: false },
      { id: 'debate' as const, label: 'Debate', isActive: false, isCompleted: false },
      { id: 'voting' as const, label: 'Votação', isActive: false, isCompleted: false },
    ];

    const nightPhases: Array<{
      phase: CidadeDormeRoom['phase'];
      actorIndex: number;
    }> = [
      { phase: 'night_assassin', actorIndex: 1 },
      { phase: 'night_angel', actorIndex: 2 },
      { phase: 'night_detective', actorIndex: 0 },
    ];

    for (const scenario of nightPhases) {
      const nightRoom: CidadeDormeRoom = {
        ...baseRoom,
        phase: scenario.phase,
        currentRound: 2,
      };
      const actor = nightRoom.players[scenario.actorIndex];
      const sleeper = nightRoom.players[3];

      jest
        .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
        .mockReturnValue([
          {
            ...baseState,
            isNightPhase: true,
            isNightCardRevealed: false,
            isCurrentPlayerHost: actor.isHost,
            currentPlayerId: actor.id,
            currentPlayer: actor,
            phaseTimeline: nightTimeline,
            room: nightRoom,
          },
          actions,
        ]);
      let actorTree!: renderer.ReactTestRenderer;
      act(() => {
        actorTree = renderer.create(<CidadeDormeScreen />);
      });

      jest
        .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
        .mockReturnValue([
          {
            ...baseState,
            isNightPhase: true,
            isNightCardRevealed: false,
            isCurrentPlayerHost: sleeper.isHost,
            currentPlayerId: sleeper.id,
            currentPlayer: sleeper,
            phaseTimeline: nightTimeline,
            room: nightRoom,
          },
          actions,
        ]);
      let sleeperTree!: renderer.ReactTestRenderer;
      act(() => {
        sleeperTree = renderer.create(<CidadeDormeScreen />);
      });

      // Antes de qualquer interação, a árvore renderizada de quem age e de quem dorme deve ser idêntica
      expect(JSON.stringify(actorTree.toJSON())).toEqual(
        JSON.stringify(sleeperTree.toJSON())
      );
    }

    // Toque em "Tocar para Consultar Turno" dispara handleToggleNightCardVisibility
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isNightPhase: true,
          isNightCardRevealed: false,
          currentPlayerId: baseRoom.players[3].id,
          currentPlayer: baseRoom.players[3],
          room: { ...baseRoom, phase: 'night_assassin' },
        },
        actions,
      ]);
    let beforeTapTree!: renderer.ReactTestRenderer;
    act(() => {
      beforeTapTree = renderer.create(<CidadeDormeScreen />);
    });
    const consultBtn = beforeTapTree.root.findByProps({
      accessibilityLabel: 'Tocar para Consultar Turno',
    } as any);
    act(() => {
      consultBtn.props.onPress();
    });
    expect(actions.handleToggleNightCardVisibility).toHaveBeenCalledTimes(1);

    // Quem dorme ao tocar vê aviso neutro + botão Ocultar Tela Noturna
    jest
      .spyOn(cidadeDormeVmModule, 'useCidadeDormeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          isNightPhase: true,
          isNightCardRevealed: true,
          currentPlayerId: baseRoom.players[3].id,
          currentPlayer: baseRoom.players[3],
          room: { ...baseRoom, phase: 'night_assassin' },
        },
        actions,
      ]);
    let sleeperRevealedTree!: renderer.ReactTestRenderer;
    act(() => {
      sleeperRevealedTree = renderer.create(<CidadeDormeScreen />);
    });
    const revealedTexts = sleeperRevealedTree.root
      .findAllByType('Text' as any)
      .map((t) => t.props.children);
    expect(revealedTexts).toContain(
      'Não é seu turno de ação — mantenha os olhos fechados'
    );
    const hideBtn = sleeperRevealedTree.root.findByProps({
      accessibilityLabel: 'Ocultar Tela Noturna',
    } as any);
    act(() => {
      hideBtn.props.onPress();
    });
    expect(actions.handleHideNightCard).toHaveBeenCalledTimes(1);
  });
});
