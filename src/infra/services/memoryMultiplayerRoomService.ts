import type {
  DesenhoCategory,
  DrawingElement,
} from '@/model/entities/drawingChallenge';
import type {
  AdedonhaConfig,
  AdedonhaPhase,
  AdedonhaPlayer,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
  CidadeDormeActionKind,
  CidadeDormeActionRecord,
  CidadeDormeAlignment,
  CidadeDormeConfig,
  CidadeDormeDawnReport,
  CidadeDormeDetectiveVerdict,
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
  CidadeDormeVoteReport,
  DesenhoConfig,
  DesenhoGuess,
  DesenhoPlayer,
  DesenhoRoom,
} from '@/model/entities/multiplayerSession';
import { ConflictError, DataSourceError, ValidationError } from '@/model/errors';
import type {
  IMultiplayerRoomService,
  StartDesenhoTurnInput,
  SubmitDesenhoGuessResult,
} from '@/model/services/iMultiplayerRoomService';

export const DEFAULT_ADEDONHA_COLUMNS: string[] = [
  'Personagem Bíblico',
  'Livro da Bíblia',
  'Cidade, Monte ou Rio Bíblico',
];

const COMPANION_BIBLICAL_BANK: Record<string, Record<string, string[]>> = {
  A: {
    'Personagem Bíblico': ['Abraão', 'Arão'],
    'Livro da Bíblia': ['Atos', 'Amós'],
    'Cidade, Monte ou Rio Bíblico': ['Antioquia', 'Ararate'],
  },
  B: {
    'Personagem Bíblico': ['Barnabé', 'Boaz'],
    'Livro da Bíblia': ['Baruque', 'Filipenses'],
    'Cidade, Monte ou Rio Bíblico': ['Belém', 'Betel'],
  },
  C: {
    'Personagem Bíblico': ['Calebe', 'Cornélio'],
    'Livro da Bíblia': ['Colossenses', 'Cantares'],
    'Cidade, Monte ou Rio Bíblico': ['Cafarnaum', 'Carmelo'],
  },
  D: {
    'Personagem Bíblico': ['Davi', 'Daniel'],
    'Livro da Bíblia': ['Daniel', 'Deuteronômio'],
    'Cidade, Monte ou Rio Bíblico': ['Damasco', 'Dã'],
  },
  E: {
    'Personagem Bíblico': ['Ester', 'Elias'],
    'Livro da Bíblia': ['Efésios', 'Êxodo'],
    'Cidade, Monte ou Rio Bíblico': ['Éfeso', 'Emaús'],
  },
  J: {
    'Personagem Bíblico': ['Josué', 'Jonas'],
    'Livro da Bíblia': ['Josué', 'João'],
    'Cidade, Monte ou Rio Bíblico': ['Jerusalém', 'Jordão'],
  },
  M: {
    'Personagem Bíblico': ['Moisés', 'Maria'],
    'Livro da Bíblia': ['Mateus', 'Marcos'],
    'Cidade, Monte ou Rio Bíblico': ['Moriá', 'Macedônia'],
  },
  P: {
    'Personagem Bíblico': ['Paulo', 'Pedro'],
    'Livro da Bíblia': ['Provérbios', 'Salmos'],
    'Cidade, Monte ou Rio Bíblico': ['Patmos', 'Peníel'],
  },
  S: {
    'Personagem Bíblico': ['Salomão', 'Samuel'],
    'Livro da Bíblia': ['Salmos', 'Sofonias'],
    'Cidade, Monte ou Rio Bíblico': ['Sinai', 'Samaria'],
  },
};

function createDefaultRoom(): AdedonhaRoom {
  return {
    id: 'room-adedonha-1',
    code: 'PG2026',
    gameType: 'adedonha',
    hostId: 'player-host',
    phase: 'lobby',
    version: 0,
    phaseEndsAt: null,
    config: {
      columns: [...DEFAULT_ADEDONHA_COLUMNS],
      roundDurationSeconds: 90,
      totalRounds: 5,
      excludeHardLetters: true,
    },
    currentRound: 1,
    currentLetter: null,
    usedLetters: [],
    currentTallyColumnIndex: 0,
    stopTriggeredBy: null,
    players: [
      {
        id: 'player-host',
        nickname: 'Líder do PG',
        isHost: true,
        score: 0,
        stopCount: 0,
        uniqueAnswersCount: 0,
      },
      {
        id: 'player-2',
        nickname: 'Ana',
        isHost: false,
        score: 0,
        stopCount: 0,
        uniqueAnswersCount: 0,
      },
      {
        id: 'player-3',
        nickname: 'Lucas',
        isHost: false,
        score: 0,
        stopCount: 0,
        uniqueAnswersCount: 0,
      },
    ],
    submissions: [],
  };
}

function cloneRoom(room: AdedonhaRoom): AdedonhaRoom {
  return {
    ...room,
    config: {
      ...room.config,
      columns: [...room.config.columns],
    },
    usedLetters: [...room.usedLetters],
    players: room.players.map((p) => ({ ...p })),
    submissions: room.submissions.map((s) => ({ ...s })),
  };
}

function createDefaultCidadeDormePlayers(
  hostNickname = 'Líder do PG'
): CidadeDormePlayer[] {
  return [
    {
      id: 'cd-player-1',
      nickname: hostNickname,
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
    {
      id: 'cd-player-6',
      nickname: 'Sara',
      isHost: false,
      isAlive: true,
      isReady: false,
      role: 'cidadao',
      hasVoted: false,
    },
  ];
}

function createDefaultCidadeDormeRoom(): CidadeDormeRoom {
  return {
    id: 'room-cidade-dorme-1',
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
    narratorCaption:
      'Sala pronta no Lobby. Configure a voz do Narrador e inicie quando todos estiverem na roda.',
    players: createDefaultCidadeDormePlayers(),
    allyAssassinIds: [],
    nightTargetId: null,
    nightProtectedId: null,
    detectiveVerdict: null,
    votesByPlayerId: {},
    dawnReport: null,
    voteReport: null,
    winner: null,
  };
}

function cloneCidadeDormeRoom(room: CidadeDormeRoom): CidadeDormeRoom {
  return {
    ...room,
    config: { ...room.config },
    players: room.players.map((p) => ({ ...p })),
    allyAssassinIds: room.allyAssassinIds ? [...room.allyAssassinIds] : [],
    detectiveVerdict: room.detectiveVerdict
      ? { ...room.detectiveVerdict }
      : null,
    votesByPlayerId: { ...room.votesByPlayerId },
    dawnReport: room.dawnReport ? { ...room.dawnReport } : null,
    voteReport: room.voteReport
      ? {
          ...room.voteReport,
          voteCounts: { ...room.voteReport.voteCounts },
        }
      : null,
  };
}

const DEFAULT_DESENHO_CATEGORIES: DesenhoCategory[] = [
  'Bíblico',
  'Animais',
  'Objetos',
  'Comidas',
  'Lugares e Natureza',
];

function normalizeDesenhoText(text: string): string {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function cloneDrawingElement(element: DrawingElement): DrawingElement {
  if (element.tool === 'freehand') {
    return {
      ...element,
      points: element.points.map((p) => ({ x: p.x, y: p.y })),
    };
  }
  return {
    ...element,
    start: { x: element.start.x, y: element.start.y },
    end: { x: element.end.x, y: element.end.y },
  };
}

function createDefaultDesenhoRoom(): DesenhoRoom {
  return {
    id: 'room-desenho-1',
    code: 'DR2026',
    gameType: 'desenho',
    hostId: 'desenho-player-1',
    phase: 'lobby',
    version: 0,
    phaseEndsAt: null,
    config: {
      turnDurationSeconds: 90,
      totalRounds: 2,
      categories: [...DEFAULT_DESENHO_CATEGORIES],
    },
    currentRound: 1,
    drawerOrder: [],
    currentDrawerIndex: 0,
    currentDrawerId: null,
    currentCardCategory: null,
    currentSecretWord: null,
    usedCardIds: [],
    elements: [],
    guesses: [],
    players: [
      {
        id: 'desenho-player-1',
        nickname: 'Líder do PG',
        isHost: true,
        score: 0,
        drawingScore: 0,
        firstGuessCount: 0,
        hasGuessedCurrentTurn: false,
      },
      {
        id: 'desenho-player-2',
        nickname: 'Ana',
        isHost: false,
        score: 0,
        drawingScore: 0,
        firstGuessCount: 0,
        hasGuessedCurrentTurn: false,
      },
      {
        id: 'desenho-player-3',
        nickname: 'Lucas',
        isHost: false,
        score: 0,
        drawingScore: 0,
        firstGuessCount: 0,
        hasGuessedCurrentTurn: false,
      },
    ],
  };
}

function cloneDesenhoRoom(room: DesenhoRoom): DesenhoRoom {
  return {
    ...room,
    config: {
      ...room.config,
      categories: [...room.config.categories],
    },
    drawerOrder: [...room.drawerOrder],
    usedCardIds: [...room.usedCardIds],
    elements: room.elements.map(cloneDrawingElement),
    guesses: room.guesses.map((g) => ({ ...g })),
    players: room.players.map((p) => ({ ...p })),
  };
}

export class MemoryMultiplayerRoomService implements IMultiplayerRoomService {
  private rooms: Map<string, AdedonhaRoom> = new Map();
  private activeRoomId: string;
  private localPlayerIdByRoom: Map<string, string> = new Map();
  private listeners: Map<string, Set<(room: AdedonhaRoom) => void>> = new Map();
  private cidadeDormeRooms: Map<string, CidadeDormeRoom> = new Map();
  private activeCidadeDormeRoomId: string;
  private cidadeDormeListeners: Map<
    string,
    Set<(room: CidadeDormeRoom) => void>
  > = new Map();
  private cidadeDormeRolesByRoom: Map<string, Map<string, CidadeDormeRole>> =
    new Map();
  private cidadeDormeVerdictsByRoom: Map<
    string,
    Map<string, CidadeDormeDetectiveVerdict>
  > = new Map();
  private cidadeDormeActionsByRoom: Map<
    string,
    Map<string, CidadeDormeActionRecord>
  > = new Map();
  private cidadeDormeLocks: Map<string, Promise<void>> = new Map();
  private cidadeDormeActionCounter = 0;
  private desenhoRooms: Map<string, DesenhoRoom> = new Map();
  private activeDesenhoRoomId: string;
  private desenhoSecretsByRoom: Map<string, string | null> = new Map();
  private desenhoListeners: Map<string, Set<(room: DesenhoRoom) => void>> =
    new Map();
  private desenhoGuessCounter = 0;
  private playerIdCounter = 100;

  constructor(
    initialRoom?: AdedonhaRoom,
    initialCidadeDormeRoom?: CidadeDormeRoom,
    initialDesenhoRoom?: DesenhoRoom
  ) {
    const seedRoom = initialRoom ? cloneRoom(initialRoom) : createDefaultRoom();
    this.rooms.set(seedRoom.id, seedRoom);
    this.activeRoomId = seedRoom.id;
    this.localPlayerIdByRoom.set(seedRoom.id, seedRoom.hostId);

    const seedCidadeDorme = initialCidadeDormeRoom
      ? cloneCidadeDormeRoom(initialCidadeDormeRoom)
      : createDefaultCidadeDormeRoom();
    this.cidadeDormeRooms.set(seedCidadeDorme.id, seedCidadeDorme);
    this.activeCidadeDormeRoomId = seedCidadeDorme.id;
    this.localPlayerIdByRoom.set(seedCidadeDorme.id, seedCidadeDorme.hostId);
    const seedRoles = new Map<string, CidadeDormeRole>();
    for (const p of seedCidadeDorme.players) {
      if (p.role) {
        seedRoles.set(p.id, p.role);
      }
    }
    this.cidadeDormeRolesByRoom.set(seedCidadeDorme.id, seedRoles);

    const seedDesenho = initialDesenhoRoom
      ? cloneDesenhoRoom(initialDesenhoRoom)
      : createDefaultDesenhoRoom();
    this.desenhoRooms.set(seedDesenho.id, seedDesenho);
    this.activeDesenhoRoomId = seedDesenho.id;
    this.localPlayerIdByRoom.set(seedDesenho.id, seedDesenho.hostId);
    this.desenhoSecretsByRoom.set(
      seedDesenho.id,
      seedDesenho.currentSecretWord
    );
  }

  private resolveRoom(roomId?: string): AdedonhaRoom {
    const targetId = roomId ?? this.activeRoomId;
    const room = this.rooms.get(targetId);
    if (!room) {
      throw new DataSourceError('Sala multiplayer não encontrada.');
    }
    return room;
  }

  private saveAndNotify(room: AdedonhaRoom): AdedonhaRoom {
    const versioned: AdedonhaRoom = { ...room, version: (room.version ?? 0) + 1 };
    this.rooms.set(versioned.id, versioned);
    const snapshot = cloneRoom(versioned);
    const roomListeners = this.listeners.get(versioned.id);
    if (roomListeners) {
      roomListeners.forEach((listener) => listener(cloneRoom(snapshot)));
    }
    return snapshot;
  }

  async getLocalPlayerId(roomId?: string): Promise<string | null> {
    const targetId = roomId ?? this.activeRoomId;
    return this.localPlayerIdByRoom.get(targetId) ?? null;
  }

  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: AdedonhaRoom) => void
  ): () => void {
    const listeners = this.listeners.get(roomId) ?? new Set();
    listeners.add(onRoomUpdated);
    this.listeners.set(roomId, listeners);

    return () => {
      const current = this.listeners.get(roomId);
      if (!current) return;
      current.delete(onRoomUpdated);
      if (current.size === 0) {
        this.listeners.delete(roomId);
      }
    };
  }

  async getAdedonhaRoom(roomId?: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    return cloneRoom(room);
  }

  async createAdedonhaRoom(
    hostNickname: string,
    initialColumns: string[] = DEFAULT_ADEDONHA_COLUMNS
  ): Promise<AdedonhaRoom> {
    try {
      const id = `room-${Date.now()}`;
      const code = `PG${String(this.rooms.size + 1000).slice(-4)}`;
      const room: AdedonhaRoom = {
        id,
        code,
        gameType: 'adedonha',
        hostId: 'player-host',
        phase: 'lobby',
        version: 0,
        phaseEndsAt: null,
        config: {
          columns: [...initialColumns],
          roundDurationSeconds: 90,
          totalRounds: 5,
          excludeHardLetters: true,
        },
        currentRound: 1,
        currentLetter: null,
        usedLetters: [],
        currentTallyColumnIndex: 0,
        stopTriggeredBy: null,
        players: [
          {
            id: 'player-host',
            nickname: hostNickname,
            isHost: true,
            score: 0,
            stopCount: 0,
            uniqueAnswersCount: 0,
          },
          {
            id: 'player-2',
            nickname: 'Ana',
            isHost: false,
            score: 0,
            stopCount: 0,
            uniqueAnswersCount: 0,
          },
          {
            id: 'player-3',
            nickname: 'Lucas',
            isHost: false,
            score: 0,
            stopCount: 0,
            uniqueAnswersCount: 0,
          },
        ],
        submissions: [],
      };
      this.activeRoomId = id;
      this.localPlayerIdByRoom.set(id, room.hostId);
      return this.saveAndNotify(room);
    } catch (err: unknown) {
      if (err instanceof DataSourceError) throw err;
      throw new DataSourceError('Não foi possível criar a sala de Adedonha Bíblica.');
    }
  }

  async joinAdedonhaRoom(code: string, nickname: string): Promise<AdedonhaRoom> {
    const normalizedCode = code.trim().toUpperCase();
    const found = Array.from(this.rooms.values()).find(
      (r) => r.code.toUpperCase() === normalizedCode
    );
    if (!found) {
      throw new DataSourceError('Código de sala não encontrado.');
    }

    const cleanNick = nickname.trim();
    const existingPlayer = found.players.find(
      (p) => p.nickname.toLowerCase() === cleanNick.toLowerCase()
    );
    if (existingPlayer) {
      this.activeRoomId = found.id;
      this.localPlayerIdByRoom.set(found.id, existingPlayer.id);
      return cloneRoom(found);
    }

    if (found.phase !== 'lobby') {
      throw new ValidationError(
        'A partida já começou. Novos jogadores só podem entrar no Lobby.'
      );
    }

    this.playerIdCounter += 1;
    const newPlayer: AdedonhaPlayer = {
      id: `player-${this.playerIdCounter}`,
      nickname: cleanNick,
      isHost: false,
      score: 0,
      stopCount: 0,
      uniqueAnswersCount: 0,
    };

    const updated: AdedonhaRoom = {
      ...found,
      players: [...found.players, newPlayer],
    };
    this.activeRoomId = found.id;
    this.localPlayerIdByRoom.set(found.id, newPlayer.id);
    return this.saveAndNotify(updated);
  }

  async leaveAdedonhaRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (this.localPlayerIdByRoom.get(roomId) === playerId) {
      this.localPlayerIdByRoom.delete(roomId);
    }
    if (room.phase === 'lobby' && playerId !== room.hostId) {
      const updated: AdedonhaRoom = {
        ...room,
        players: room.players.filter((p) => p.id !== playerId),
      };
      this.saveAndNotify(updated);
    }
  }

  async updateAdedonhaColumns(
    roomId: string,
    columns: string[]
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const updated: AdedonhaRoom = {
      ...room,
      config: {
        ...room.config,
        columns: [...columns],
      },
    };
    return this.saveAndNotify(updated);
  }

  async updateAdedonhaConfig(
    roomId: string,
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const updated: AdedonhaRoom = {
      ...room,
      config: {
        ...room.config,
        ...partialConfig,
      },
    };
    return this.saveAndNotify(updated);
  }

  async spinAlphabetRoulette(
    roomId: string,
    drawnLetter: string
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const upper = drawnLetter.toUpperCase();
    const updatedUsed = room.usedLetters.includes(upper)
      ? [...room.usedLetters]
      : [...room.usedLetters, upper];

    const updated: AdedonhaRoom = {
      ...room,
      phase: 'roulette',
      currentLetter: upper,
      usedLetters: updatedUsed,
      currentTallyColumnIndex: 0,
      stopTriggeredBy: null,
      submissions: [],
    };
    return this.saveAndNotify(updated);
  }

  async openRoundFilling(
    roomId: string,
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    if (expectedPhase && room.phase !== expectedPhase) {
      throw new ConflictError('A sala mudou de fase antes de abrir o preenchimento.');
    }
    const updated: AdedonhaRoom = {
      ...room,
      phase: 'filling',
      phaseEndsAt: new Date(
        Date.now() + room.config.roundDurationSeconds * 1000
      ).toISOString(),
    };
    return this.saveAndNotify(updated);
  }

  async submitPlayerAnswers(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    if (room.phase !== 'filling' && room.phase !== 'stop_countdown') {
      throw new ConflictError('Envio de respostas encerrado para esta rodada.');
    }
    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new DataSourceError('Jogador não encontrado na sala.');
    }

    const otherSubmissions = room.submissions.filter(
      (s) => !(s.roundNumber === room.currentRound && s.playerId === playerId)
    );

    const playerSubmissions: AdedonhaSubmission[] = room.config.columns.map(
      (columnName, colIdx) => ({
        id: `sub-${room.currentRound}-${playerId}-${colIdx}`,
        roomId: room.id,
        roundNumber: room.currentRound,
        playerId,
        playerNickname: player.nickname,
        columnName,
        answerText: (answers[columnName] ?? '').trim(),
        status: 'pending',
        doubtCount: 0,
        points: 0,
      })
    );

    let allSubmissions = [...otherSubmissions, ...playerSubmissions];

    // Se o anfitrião submeteu e os companheiros simulados ainda não têm respostas nesta rodada, gera respostas temáticas para demonstrar a apuração multiplayer
    if (playerId === room.hostId && room.currentLetter) {
      const letterBank = COMPANION_BIBLICAL_BANK[room.currentLetter] ?? {};
      const companionPlayers = room.players.filter((p) => p.id !== room.hostId);

      for (let pIndex = 0; pIndex < companionPlayers.length; pIndex++) {
        const companion = companionPlayers[pIndex];
        const hasSubmitted = allSubmissions.some(
          (s) =>
            s.roundNumber === room.currentRound && s.playerId === companion.id
        );
        if (!hasSubmitted) {
          const companionSubs: AdedonhaSubmission[] = room.config.columns.map(
            (columnName, colIdx) => {
              const suggestions = letterBank[columnName] ?? [];
              const fallbackWord =
                pIndex === 0
                  ? (answers[columnName] ?? '').trim()
                  : `${room.currentLetter}abriel`;
              const chosenWord = suggestions[pIndex] ?? fallbackWord;
              return {
                id: `sub-${room.currentRound}-${companion.id}-${colIdx}`,
                roomId: room.id,
                roundNumber: room.currentRound,
                playerId: companion.id,
                playerNickname: companion.nickname,
                columnName,
                answerText: chosenWord,
                status: 'pending',
                doubtCount: 0,
                points: 0,
              };
            }
          );
          allSubmissions = [...allSubmissions, ...companionSubs];
        }
      }
    }

    const updated: AdedonhaRoom = {
      ...room,
      submissions: allSubmissions,
    };
    return this.saveAndNotify(updated);
  }

  async triggerAdedonhaStop(
    roomId: string,
    playerId: string
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    if (room.phase === 'stop_countdown') {
      return cloneRoom(room);
    }
    if (room.phase !== 'filling') {
      throw new ConflictError('ADEDONHA só pode ser acionado durante o preenchimento.');
    }
    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new DataSourceError('Jogador não encontrado para acionar ADEDONHA.');
    }

    const updatedPlayers = room.players.map((p) =>
      p.id === playerId ? { ...p, stopCount: p.stopCount + 1 } : p
    );

    const updated: AdedonhaRoom = {
      ...room,
      phase: 'stop_countdown',
      phaseEndsAt: new Date(Date.now() + 5000).toISOString(),
      stopTriggeredBy: player.nickname,
      players: updatedPlayers,
    };
    return this.saveAndNotify(updated);
  }

  async startTallyPhase(
    roomId: string,
    classifiedSubmissions: AdedonhaSubmission[],
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    if (expectedPhase && room.phase !== expectedPhase) {
      throw new ConflictError('A sala já avançou para outra fase.');
    }
    const recalculatedPlayers = this.recalculatePlayersScore(
      room.players,
      classifiedSubmissions
    );

    const updated: AdedonhaRoom = {
      ...room,
      phase: 'tally',
      phaseEndsAt: null,
      currentTallyColumnIndex: 0,
      submissions: classifiedSubmissions.map((s) => ({ ...s })),
      players: recalculatedPlayers,
    };
    return this.saveAndNotify(updated);
  }

  async raiseDoubt(roomId: string, submissionId: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const target = room.submissions.find((s) => s.id === submissionId);
    if (!target) {
      throw new DataSourceError('Submissão não encontrada para levantar dúvida.');
    }

    const updatedSubmissions = room.submissions.map((s) =>
      s.id === submissionId ? { ...s, doubtCount: s.doubtCount + 1 } : s
    );

    const updated: AdedonhaRoom = {
      ...room,
      submissions: updatedSubmissions,
    };
    return this.saveAndNotify(updated);
  }

  async judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict,
    points: number
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const target = room.submissions.find((s) => s.id === submissionId);
    if (!target) {
      throw new DataSourceError('Submissão não encontrada para julgamento.');
    }

    const updatedSubmissions = room.submissions.map((s) =>
      s.id === submissionId ? { ...s, status: verdict, points } : s
    );

    const updatedPlayers = this.recalculatePlayersScore(
      room.players,
      updatedSubmissions
    );

    const updated: AdedonhaRoom = {
      ...room,
      submissions: updatedSubmissions,
      players: updatedPlayers,
    };
    return this.saveAndNotify(updated);
  }

  async advanceTallyColumn(roomId: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const nextIndex = room.currentTallyColumnIndex + 1;

    if (nextIndex < room.config.columns.length) {
      const updated: AdedonhaRoom = {
        ...room,
        currentTallyColumnIndex: nextIndex,
      };
      this.rooms.set(room.id, updated);
      return cloneRoom(updated);
    }

    const isLastRound = room.currentRound >= room.config.totalRounds;
    const updated: AdedonhaRoom = {
      ...room,
      phase: isLastRound ? 'finished' : 'round_summary',
    };
    return this.saveAndNotify(updated);
  }

  async advanceToNextRound(
    roomId: string,
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    if (expectedPhase && room.phase !== expectedPhase) {
      throw new ConflictError('A rodada já foi avançada.');
    }
    if (room.currentRound >= room.config.totalRounds) {
      const finished: AdedonhaRoom = {
        ...room,
        phase: 'finished',
      };
      return this.saveAndNotify(finished);
    }

    const updated: AdedonhaRoom = {
      ...room,
      phase: 'lobby',
      currentRound: room.currentRound + 1,
      currentLetter: null,
      currentTallyColumnIndex: 0,
      stopTriggeredBy: null,
    };
    return this.saveAndNotify(updated);
  }

  private recalculatePlayersScore(
    players: AdedonhaPlayer[],
    submissions: AdedonhaSubmission[]
  ): AdedonhaPlayer[] {
    return players.map((player) => {
      const playerSubs = submissions.filter((s) => s.playerId === player.id);
      const totalScore = playerSubs.reduce((acc, s) => acc + s.points, 0);
      const uniqueCount = playerSubs.filter((s) => s.status === 'unique').length;
      return {
        ...player,
        score: totalScore,
        uniqueAnswersCount: uniqueCount,
      };
    });
  }

  private async withCidadeDormeLock<T>(
    roomId: string,
    task: () => Promise<T> | T
  ): Promise<T> {
    const prev = this.cidadeDormeLocks.get(roomId) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.cidadeDormeLocks.set(roomId, prev.then(() => next));
    await prev;
    try {
      return await task();
    } finally {
      release();
    }
  }

  private resolveCidadeDormeRoom(roomId?: string): CidadeDormeRoom {
    const targetId = roomId ?? this.activeCidadeDormeRoomId;
    const room = this.cidadeDormeRooms.get(targetId);
    if (!room) {
      throw new DataSourceError('Sala de Cidade Dorme não encontrada.');
    }
    return room;
  }

  private getSecretRoleMap(room: CidadeDormeRoom): Map<string, CidadeDormeRole> {
    let map = this.cidadeDormeRolesByRoom.get(room.id);
    if (!map) {
      map = new Map<string, CidadeDormeRole>();
      for (const player of room.players) {
        if (player.role) {
          map.set(player.id, player.role);
        }
      }
      this.cidadeDormeRolesByRoom.set(room.id, map);
    }
    return map;
  }

  private evaluateWinnerFromSecretRoles(
    players: CidadeDormePlayer[],
    roleMap: Map<string, CidadeDormeRole>
  ): CidadeDormeAlignment | null {
    const alivePlayers = players.filter((p) => p.isAlive);
    const aliveAssassins = alivePlayers.filter(
      (p) => (roleMap.get(p.id) ?? p.role) === 'assassino'
    ).length;
    const aliveInnocents = alivePlayers.length - aliveAssassins;

    if (aliveAssassins === 0) {
      return 'cidade';
    }
    if (aliveAssassins >= aliveInnocents) {
      return 'infiltrados';
    }
    return null;
  }

  private recordCidadeDormeAction(
    roomId: string,
    roundNumber: number,
    playerId: string,
    kind: CidadeDormeActionKind,
    targetId: string | null
  ): CidadeDormeActionRecord {
    let actionMap = this.cidadeDormeActionsByRoom.get(roomId);
    if (!actionMap) {
      actionMap = new Map<string, CidadeDormeActionRecord>();
      this.cidadeDormeActionsByRoom.set(roomId, actionMap);
    }
    const key = `${roundNumber}:${playerId}:${kind}`;
    actionMap.delete(key);
    this.cidadeDormeActionCounter += 1;
    const record: CidadeDormeActionRecord = {
      id: `cd-act-${this.cidadeDormeActionCounter}`,
      roomId,
      roundNumber,
      playerId,
      kind,
      targetId,
      createdAt: new Date().toISOString(),
    };
    actionMap.set(key, record);
    return record;
  }

  private buildFilteredCidadeDormeSnapshot(
    room: CidadeDormeRoom,
    viewerPlayerId?: string
  ): CidadeDormeRoom {
    const effectiveViewerId =
      viewerPlayerId ?? this.localPlayerIdByRoom.get(room.id) ?? room.hostId;
    const roleMap = this.getSecretRoleMap(room);
    const viewerRole = roleMap.get(effectiveViewerId) ?? null;
    const isFinished = room.phase === 'finished';

    const filteredPlayers: CidadeDormePlayer[] = room.players.map((p) => {
      const actualRole = roleMap.get(p.id) ?? p.role ?? null;
      const canReveal =
        isFinished ||
        p.id === effectiveViewerId ||
        (!p.isAlive && room.config.revealRoleOnDeath);
      return {
        ...p,
        role: canReveal ? actualRole : null,
      };
    });

    const allyAssassinIds =
      viewerRole === 'assassino'
        ? room.players
            .filter(
              (p) =>
                p.id !== effectiveViewerId &&
                (roleMap.get(p.id) ?? p.role) === 'assassino'
            )
            .map((p) => p.id)
        : [];

    const rawVerdict =
      this.cidadeDormeVerdictsByRoom.get(room.id)?.get(effectiveViewerId) ??
      null;
    const detectiveVerdict =
      viewerRole === 'detetive' &&
      rawVerdict &&
      rawVerdict.roundNumber === room.currentRound
        ? { ...rawVerdict }
        : null;

    const cloned = cloneCidadeDormeRoom(room);
    return {
      ...cloned,
      players: filteredPlayers,
      allyAssassinIds,
      nightTargetId: null,
      nightProtectedId: null,
      detectiveVerdict,
      votesByPlayerId: {},
    };
  }

  private saveAndNotifyCidadeDorme(
    room: CidadeDormeRoom,
    viewerPlayerId?: string
  ): CidadeDormeRoom {
    const versioned: CidadeDormeRoom = {
      ...room,
      version: (room.version ?? 0) + 1,
    };
    this.cidadeDormeRooms.set(versioned.id, versioned);
    const localSnapshot = this.buildFilteredCidadeDormeSnapshot(versioned);
    const roomListeners = this.cidadeDormeListeners.get(versioned.id);
    if (roomListeners) {
      roomListeners.forEach((listener) =>
        listener(cloneCidadeDormeRoom(localSnapshot))
      );
    }
    return viewerPlayerId
      ? this.buildFilteredCidadeDormeSnapshot(versioned, viewerPlayerId)
      : localSnapshot;
  }

  async getCidadeDormeRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<CidadeDormeRoom> {
    const room = this.resolveCidadeDormeRoom(roomId);
    return this.buildFilteredCidadeDormeSnapshot(room, viewerPlayerId);
  }

  async createCidadeDormeRoom(hostNickname: string): Promise<CidadeDormeRoom> {
    try {
      const id = `room-cd-${Date.now()}`;
      const code = `CD${String(this.cidadeDormeRooms.size + 1000).slice(-4)}`;
      const players = createDefaultCidadeDormePlayers(hostNickname.trim());
      const room: CidadeDormeRoom = {
        id,
        code,
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
        narratorCaption:
          'Sala criada! Escolha a voz do Narrador e aguarde os jogadores entrarem na roda.',
        players,
        allyAssassinIds: [],
        nightTargetId: null,
        nightProtectedId: null,
        detectiveVerdict: null,
        votesByPlayerId: {},
        dawnReport: null,
        voteReport: null,
        winner: null,
      };
      const roleMap = new Map<string, CidadeDormeRole>();
      for (const player of players) {
        if (player.role) {
          roleMap.set(player.id, player.role);
        }
      }
      this.cidadeDormeRolesByRoom.set(id, roleMap);
      this.activeCidadeDormeRoomId = id;
      this.localPlayerIdByRoom.set(id, room.hostId);
      return this.saveAndNotifyCidadeDorme(room);
    } catch (err: unknown) {
      if (err instanceof DataSourceError) throw err;
      throw new DataSourceError('Não foi possível criar a sala de Cidade Dorme.');
    }
  }

  async joinCidadeDormeRoom(
    code: string,
    nickname: string
  ): Promise<CidadeDormeRoom> {
    const normalizedCode = code.trim().toUpperCase();
    const found = Array.from(this.cidadeDormeRooms.values()).find(
      (r) => r.code.toUpperCase() === normalizedCode
    );
    if (!found) {
      throw new DataSourceError('Código de sala do Cidade Dorme não encontrado.');
    }

    const cleanNick = nickname.trim();
    const existing = found.players.find(
      (p) => p.nickname.toLowerCase() === cleanNick.toLowerCase()
    );
    if (existing) {
      this.activeCidadeDormeRoomId = found.id;
      this.localPlayerIdByRoom.set(found.id, existing.id);
      return this.buildFilteredCidadeDormeSnapshot(found, existing.id);
    }

    if (found.phase !== 'lobby') {
      throw new ValidationError(
        'A partida já começou. Novos jogadores só podem entrar no Lobby.'
      );
    }

    this.playerIdCounter += 1;
    const newPlayer: CidadeDormePlayer = {
      id: `cd-player-${this.playerIdCounter}`,
      nickname: cleanNick,
      isHost: false,
      isAlive: true,
      isReady: false,
      role: 'cidadao',
      hasVoted: false,
    };

    const roleMap = this.getSecretRoleMap(found);
    roleMap.set(newPlayer.id, 'cidadao');

    const updated: CidadeDormeRoom = {
      ...found,
      players: [...found.players, newPlayer],
    };
    this.activeCidadeDormeRoomId = found.id;
    this.localPlayerIdByRoom.set(found.id, newPlayer.id);
    return this.saveAndNotifyCidadeDorme(updated, newPlayer.id);
  }

  async leaveCidadeDormeRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.cidadeDormeRooms.get(roomId);
    if (!room) return;
    if (this.localPlayerIdByRoom.get(roomId) === playerId) {
      this.localPlayerIdByRoom.delete(roomId);
    }
    if (room.phase === 'lobby' && playerId !== room.hostId) {
      const roleMap = this.cidadeDormeRolesByRoom.get(roomId);
      roleMap?.delete(playerId);
      const updated: CidadeDormeRoom = {
        ...room,
        players: room.players.filter((p) => p.id !== playerId),
      };
      this.saveAndNotifyCidadeDorme(updated);
    }
  }

  async updateCidadeDormeConfig(
    roomId: string,
    partialConfig: Partial<CidadeDormeConfig>
  ): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      const updated: CidadeDormeRoom = {
        ...room,
        config: {
          ...room.config,
          ...partialConfig,
        },
      };
      return this.saveAndNotifyCidadeDorme(updated);
    });
  }

  async saveCidadeDormeRoom(room: CidadeDormeRoom): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(room.id, () => {
      const current = this.resolveCidadeDormeRoom(room.id);
      const roleMap = this.getSecretRoleMap(current);
      for (const player of room.players) {
        if (player.role) {
          roleMap.set(player.id, player.role);
        }
      }

      const mergedPlayers: CidadeDormePlayer[] = room.players.map((p) => ({
        ...p,
        role: p.role ?? roleMap.get(p.id) ?? null,
      }));

      const currentLocalId = this.localPlayerIdByRoom.get(room.id);
      if (
        currentLocalId &&
        !mergedPlayers.some((p) => p.id === currentLocalId)
      ) {
        this.localPlayerIdByRoom.set(room.id, room.hostId);
      }

      if (
        room.phase === 'day_voting' &&
        mergedPlayers.every((p) => !p.hasVoted) &&
        Object.keys(room.votesByPlayerId).length === 0
      ) {
        const actionMap = this.cidadeDormeActionsByRoom.get(room.id);
        if (actionMap) {
          for (const [key, act] of actionMap.entries()) {
            if (act.roundNumber === room.currentRound && act.kind === 'vote') {
              actionMap.delete(key);
            }
          }
        }
      }

      const mergedRoom: CidadeDormeRoom = {
        ...cloneCidadeDormeRoom(room),
        phaseEndsAt: room.phaseEndsAt ?? null,
        players: mergedPlayers,
      };
      return this.saveAndNotifyCidadeDorme(mergedRoom);
    });
  }

  async startCidadeDormeMatch(
    roomId: string,
    assignedRolesByPlayerId: Record<string, CidadeDormeRole>,
    narratorCaption: string
  ): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      const roleMap = new Map<string, CidadeDormeRole>();
      const updatedPlayers: CidadeDormePlayer[] = room.players.map((p) => {
        const assigned = assignedRolesByPlayerId[p.id] ?? 'cidadao';
        roleMap.set(p.id, assigned);
        return {
          ...p,
          isAlive: true,
          isReady: false,
          hasVoted: false,
          role: assigned,
        };
      });

      this.cidadeDormeRolesByRoom.set(room.id, roleMap);
      this.cidadeDormeVerdictsByRoom.delete(room.id);
      this.cidadeDormeActionsByRoom.delete(room.id);

      const updated: CidadeDormeRoom = {
        ...room,
        phase: 'role_reveal',
        currentRound: 1,
        phaseEndsAt: null,
        narratorCaption,
        players: updatedPlayers,
        nightTargetId: null,
        nightProtectedId: null,
        detectiveVerdict: null,
        votesByPlayerId: {},
        dawnReport: null,
        voteReport: null,
        winner: null,
      };

      return this.saveAndNotifyCidadeDorme(updated);
    });
  }

  async markCidadeDormePlayerReady(
    roomId: string,
    playerId: string,
    options?: {
      markCompanionsReady?: boolean;
      nightTurnEndsAt?: string | null;
      nightCaption?: string;
    }
  ): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      const target = room.players.find((p) => p.id === playerId);
      if (!target) {
        throw new ValidationError('Jogador não encontrado na sala.');
      }

      const existingAction = this.cidadeDormeActionsByRoom
        .get(room.id)
        ?.get(`${room.currentRound}:${playerId}:ready`);

      if (room.phase !== 'role_reveal') {
        if (existingAction && target.isReady) {
          return this.buildFilteredCidadeDormeSnapshot(room, playerId);
        }
        throw new ValidationError(
          'A confirmação de papel só pode ocorrer na fase de revelação.'
        );
      }

      const markAll = Boolean(options?.markCompanionsReady);
      const updatedPlayers = room.players.map((p) => {
        if (markAll || p.id === playerId) {
          this.recordCidadeDormeAction(
            room.id,
            room.currentRound,
            p.id,
            'ready',
            null
          );
          return { ...p, isReady: true };
        }
        return { ...p };
      });

      const allReady = updatedPlayers.every((p) => p.isReady);
      if (!allReady) {
        const partialRoom: CidadeDormeRoom = {
          ...room,
          players: updatedPlayers,
        };
        return this.saveAndNotifyCidadeDorme(partialRoom, playerId);
      }

      const nightCaption =
        options?.nightCaption ??
        'A cidade dorme... Todos fecham os olhos. Assassino, acorde e escolha sua vítima.';
      const nightRoom: CidadeDormeRoom = {
        ...room,
        phase: 'night_assassin',
        phaseEndsAt: options?.nightTurnEndsAt ?? null,
        narratorCaption: nightCaption,
        players: updatedPlayers,
        nightTargetId: null,
        nightProtectedId: null,
        detectiveVerdict: null,
      };
      return this.saveAndNotifyCidadeDorme(nightRoom, playerId);
    });
  }

  async submitCidadeDormeNightAction(
    roomId: string,
    actorPlayerId: string,
    kind: 'night_assassin' | 'night_angel' | 'night_detective',
    targetPlayerId: string | null
  ): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      const roleMap = this.getSecretRoleMap(room);
      this.recordCidadeDormeAction(
        room.id,
        room.currentRound,
        actorPlayerId,
        kind,
        targetPlayerId
      );

      let nextRoom: CidadeDormeRoom = { ...room };

      if (kind === 'night_detective' && targetPlayerId) {
        const suspect = room.players.find((p) => p.id === targetPlayerId);
        if (suspect) {
          const suspectRole = roleMap.get(suspect.id) ?? suspect.role;
          const verdict: CidadeDormeDetectiveVerdict = {
            targetPlayerId: suspect.id,
            targetNickname: suspect.nickname,
            isAssassin: suspectRole === 'assassino',
            roundNumber: room.currentRound,
          };
          let verdictsForRoom = this.cidadeDormeVerdictsByRoom.get(room.id);
          if (!verdictsForRoom) {
            verdictsForRoom = new Map<string, CidadeDormeDetectiveVerdict>();
            this.cidadeDormeVerdictsByRoom.set(room.id, verdictsForRoom);
          }
          verdictsForRoom.set(actorPlayerId, verdict);
          nextRoom = {
            ...nextRoom,
            detectiveVerdict: verdict,
          };
        }
      }

      return this.saveAndNotifyCidadeDorme(nextRoom, actorPlayerId);
    });
  }

  async submitCidadeDormeVote(
    roomId: string,
    voterPlayerId: string,
    targetPlayerIdOrSkip: string
  ): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      if (room.phase !== 'day_voting') {
        throw new ValidationError('A sala não está em fase de votação.');
      }
      const voter = room.players.find((p) => p.id === voterPlayerId);
      if (!voter) {
        throw new ValidationError('Jogador votante não encontrado na sala.');
      }
      if (!voter.isAlive) {
        throw new ValidationError(
          'Você foi eliminado e está no Modo Espectador — acompanhe em silêncio.'
        );
      }

      this.recordCidadeDormeAction(
        room.id,
        room.currentRound,
        voterPlayerId,
        'vote',
        targetPlayerIdOrSkip
      );

      const updatedPlayers = room.players.map((p) =>
        p.id === voterPlayerId ? { ...p, hasVoted: true } : { ...p }
      );
      const updatedVotes = {
        ...room.votesByPlayerId,
        [voterPlayerId]: targetPlayerIdOrSkip,
      };

      const updated: CidadeDormeRoom = {
        ...room,
        players: updatedPlayers,
        votesByPlayerId: updatedVotes,
      };
      return this.saveAndNotifyCidadeDorme(updated, voterPlayerId);
    });
  }

  async resolveCidadeDormeDawn(
    roomId: string,
    options?: {
      debateEndsAt?: string | null;
    }
  ): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      if (room.phase !== 'night_detective') {
        throw new ValidationError(
          'O amanhecer só ocorre após a conclusão dos turnos da noite.'
        );
      }

      const roleMap = this.getSecretRoleMap(room);
      const actions = Array.from(
        this.cidadeDormeActionsByRoom.get(room.id)?.values() ?? []
      ).filter((a) => a.roundNumber === room.currentRound);

      const assassinActions = actions.filter((a) => a.kind === 'night_assassin');
      const angelActions = actions.filter((a) => a.kind === 'night_angel');

      const nightTargetId =
        assassinActions.length > 0
          ? assassinActions[assassinActions.length - 1].targetId
          : room.nightTargetId;
      const nightProtectedId =
        angelActions.length > 0
          ? angelActions[angelActions.length - 1].targetId
          : room.nightProtectedId;

      const attacked = nightTargetId
        ? room.players.find((p) => p.id === nightTargetId) ?? null
        : null;
      const savedByAngel = Boolean(
        attacked && nightProtectedId && attacked.id === nightProtectedId
      );

      const updatedPlayers = room.players.map((p) => {
        if (!savedByAngel && attacked && p.id === attacked.id) {
          return { ...p, isAlive: false, hasVoted: false };
        }
        return { ...p, hasVoted: false };
      });

      const attackedRole = attacked
        ? roleMap.get(attacked.id) ?? attacked.role ?? null
        : null;

      const dawnReport: CidadeDormeDawnReport = {
        roundNumber: room.currentRound,
        attackedPlayerId: attacked?.id ?? null,
        attackedNickname: attacked?.nickname ?? null,
        savedByAngel,
        eliminatedPlayerId: savedByAngel ? null : (attacked?.id ?? null),
        eliminatedNickname: savedByAngel ? null : (attacked?.nickname ?? null),
        eliminatedRole:
          !savedByAngel && attacked && room.config.revealRoleOnDeath
            ? attackedRole
            : null,
      };

      const winner = this.evaluateWinnerFromSecretRoles(
        updatedPlayers,
        roleMap
      );
      let caption: string;

      if (winner === 'infiltrados') {
        caption = attacked
          ? `A cidade acorda! Triste notícia na cidade: ${attacked.nickname} foi eliminado durante a noite. Os Assassinos atingiram a paridade e venceram a partida!`
          : 'A cidade acorda! Os Assassinos atingiram a paridade numérica e venceram a partida!';
      } else if (winner === 'cidade') {
        caption =
          'A cidade acorda! Todos os Assassinos foram neutralizados. Vitória da Cidade!';
      } else if (savedByAngel) {
        caption =
          'A cidade acorda! Todos podem abrir os olhos. A madrugada foi tensa, mas o Anjo protegeu a vítima a tempo! Ninguém foi eliminado!';
      } else if (attacked) {
        caption = `A cidade acorda! Todos podem abrir os olhos. Triste notícia na cidade: ${attacked.nickname} foi eliminado durante a noite.`;
      } else {
        caption =
          'A cidade acorda! Todos podem abrir os olhos. Ninguém foi eliminado durante a noite.';
      }

      const updated: CidadeDormeRoom = {
        ...room,
        phase: winner ? 'finished' : 'day_debate',
        phaseEndsAt: winner ? null : (options?.debateEndsAt ?? null),
        narratorCaption: caption,
        players: updatedPlayers,
        nightTargetId: null,
        nightProtectedId: null,
        dawnReport,
        voteReport: null,
        votesByPlayerId: {},
        winner,
      };
      return this.saveAndNotifyCidadeDorme(updated);
    });
  }

  async tallyCidadeDormeVotes(roomId: string): Promise<CidadeDormeRoom> {
    return this.withCidadeDormeLock(roomId, () => {
      const room = this.resolveCidadeDormeRoom(roomId);
      if (room.phase !== 'day_voting') {
        throw new ValidationError(
          'A apuração só pode ser realizada durante a fase de votação.'
        );
      }

      const roleMap = this.getSecretRoleMap(room);
      const voteActions = Array.from(
        this.cidadeDormeActionsByRoom.get(room.id)?.values() ?? []
      ).filter((a) => a.roundNumber === room.currentRound && a.kind === 'vote');

      const voteEntries: Array<[string, string]> =
        voteActions.length > 0
          ? voteActions.map((a) => [a.playerId, a.targetId ?? 'skip'])
          : Object.entries(room.votesByPlayerId);

      if (voteEntries.length === 0) {
        throw new ValidationError(
          'Registre pelo menos um voto antes de apurar a votação.'
        );
      }

      const voteCounts: Record<string, number> = {};
      let skipCount = 0;

      for (const [, targetId] of voteEntries) {
        if (targetId === 'skip') {
          skipCount += 1;
        } else {
          voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
        }
      }

      let maxVotes = 0;
      let leaders: string[] = [];
      for (const [candidateId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          leaders = [candidateId];
        } else if (count === maxVotes && count > 0) {
          leaders.push(candidateId);
        }
      }

      const tieOrSkipped =
        maxVotes === 0 || leaders.length !== 1 || skipCount >= maxVotes;

      const eliminatedPlayer = !tieOrSkipped
        ? room.players.find((p) => p.id === leaders[0]) ?? null
        : null;

      const updatedPlayers = room.players.map((p) => {
        if (eliminatedPlayer && p.id === eliminatedPlayer.id) {
          return { ...p, isAlive: false };
        }
        return { ...p };
      });

      const eliminatedRole = eliminatedPlayer
        ? roleMap.get(eliminatedPlayer.id) ?? eliminatedPlayer.role ?? null
        : null;

      const voteReport: CidadeDormeVoteReport = {
        roundNumber: room.currentRound,
        eliminatedPlayerId: eliminatedPlayer?.id ?? null,
        eliminatedNickname: eliminatedPlayer?.nickname ?? null,
        eliminatedRole:
          eliminatedPlayer && room.config.revealRoleOnDeath
            ? eliminatedRole
            : null,
        tieOrSkipped,
        voteCounts,
        skipCount,
      };

      const winner = this.evaluateWinnerFromSecretRoles(
        updatedPlayers,
        roleMap
      );
      let caption: string;

      if (winner === 'cidade') {
        caption = eliminatedPlayer
          ? `A cidade votou e eliminou ${eliminatedPlayer.nickname}! Todos os Assassinos foram descobertos: Vitória da Cidade!`
          : 'Todos os Assassinos foram descobertos: Vitória da Cidade!';
      } else if (winner === 'infiltrados') {
        caption = eliminatedPlayer
          ? `A cidade eliminou ${eliminatedPlayer.nickname}, e os Assassinos atingiram paridade numérica: Vitória dos Assassinos!`
          : 'Os Assassinos atingiram paridade numérica com os inocentes: Vitória dos Assassinos!';
      } else if (tieOrSkipped || !eliminatedPlayer) {
        caption =
          'A cidade não chegou a um consenso na votação. Ninguém foi eliminado hoje!';
      } else {
        caption = `A cidade decidiu por maioria simples: ${eliminatedPlayer.nickname} foi eliminado na votação!`;
      }

      const updated: CidadeDormeRoom = {
        ...room,
        phase: winner ? 'finished' : 'vote_result',
        phaseEndsAt: null,
        narratorCaption: caption,
        players: updatedPlayers,
        voteReport,
        votesByPlayerId: {},
        winner,
      };
      return this.saveAndNotifyCidadeDorme(updated);
    });
  }

  subscribeToCidadeDormeRoom(
    roomId: string,
    onRoomUpdated: (room: CidadeDormeRoom) => void
  ): () => void {
    const listeners = this.cidadeDormeListeners.get(roomId) ?? new Set();
    listeners.add(onRoomUpdated);
    this.cidadeDormeListeners.set(roomId, listeners);

    return () => {
      const current = this.cidadeDormeListeners.get(roomId);
      if (!current) return;
      current.delete(onRoomUpdated);
      if (current.size === 0) {
        this.cidadeDormeListeners.delete(roomId);
      }
    };
  }

  private resolveDesenhoRoom(roomId?: string): DesenhoRoom {
    const id = roomId ?? this.activeDesenhoRoomId;
    const room = this.desenhoRooms.get(id);
    if (!room) {
      throw new DataSourceError('Sala de Desenho Relâmpago não encontrada.');
    }
    return room;
  }

  private projectDesenhoRoomForViewer(
    room: DesenhoRoom,
    viewerPlayerId?: string
  ): DesenhoRoom {
    const cloned = cloneDesenhoRoom(room);
    const secretWord =
      this.desenhoSecretsByRoom.get(room.id) ?? room.currentSecretWord;
    const effectiveViewerId =
      viewerPlayerId ?? this.localPlayerIdByRoom.get(room.id) ?? room.hostId;

    if (room.phase === 'drawing') {
      cloned.currentSecretWord =
        effectiveViewerId === room.currentDrawerId ? secretWord : null;
    } else if (room.phase === 'turn_summary' || room.phase === 'finished') {
      cloned.currentSecretWord = secretWord;
    } else {
      cloned.currentSecretWord = null;
    }
    return cloned;
  }

  private saveAndNotifyDesenho(
    room: DesenhoRoom,
    viewerPlayerId?: string
  ): DesenhoRoom {
    const next: DesenhoRoom = {
      ...cloneDesenhoRoom(room),
      version: room.version + 1,
    };
    this.desenhoRooms.set(next.id, next);
    const listeners = this.desenhoListeners.get(next.id);
    if (listeners) {
      const localViewer = this.localPlayerIdByRoom.get(next.id) ?? next.hostId;
      for (const listener of listeners) {
        listener(this.projectDesenhoRoomForViewer(next, localViewer));
      }
    }
    return this.projectDesenhoRoomForViewer(next, viewerPlayerId);
  }

  async getDesenhoRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    return this.projectDesenhoRoomForViewer(room, viewerPlayerId);
  }

  async createDesenhoRoom(
    hostNickname: string,
    initialCategories?: DesenhoCategory[]
  ): Promise<DesenhoRoom> {
    this.playerIdCounter += 1;
    const roomId = `room-desenho-${this.playerIdCounter}`;
    const hostId = `desenho-host-${this.playerIdCounter}`;
    const code = `DR${String(this.playerIdCounter).slice(-4).padStart(4, '0')}`;
    const categories =
      initialCategories && initialCategories.length > 0
        ? [...initialCategories]
        : [...DEFAULT_DESENHO_CATEGORIES];

    const created: DesenhoRoom = {
      id: roomId,
      code,
      gameType: 'desenho',
      hostId,
      phase: 'lobby',
      version: 0,
      phaseEndsAt: null,
      config: {
        turnDurationSeconds: 90,
        totalRounds: 2,
        categories,
      },
      currentRound: 1,
      drawerOrder: [],
      currentDrawerIndex: 0,
      currentDrawerId: null,
      currentCardCategory: null,
      currentSecretWord: null,
      usedCardIds: [],
      elements: [],
      guesses: [],
      players: [
        {
          id: hostId,
          nickname: hostNickname.trim(),
          isHost: true,
          score: 0,
          drawingScore: 0,
          firstGuessCount: 0,
          hasGuessedCurrentTurn: false,
        },
      ],
    };

    this.desenhoRooms.set(roomId, created);
    this.activeDesenhoRoomId = roomId;
    this.localPlayerIdByRoom.set(roomId, hostId);
    this.desenhoSecretsByRoom.set(roomId, null);
    return this.projectDesenhoRoomForViewer(created, hostId);
  }

  async joinDesenhoRoom(code: string, nickname: string): Promise<DesenhoRoom> {
    const cleanCode = code.trim().toUpperCase();
    const cleanNick = nickname.trim();
    const room = Array.from(this.desenhoRooms.values()).find(
      (item) => item.code.toUpperCase() === cleanCode
    );
    if (!room) {
      throw new ValidationError(
        `Nenhuma sala de Desenho Relâmpago encontrada com o código "${cleanCode}".`
      );
    }
    if (room.phase !== 'lobby') {
      throw new ValidationError(
        'Esta sala já iniciou a partida. Aguarde a próxima rodada no Lobby.'
      );
    }
    if (room.players.length >= 16) {
      throw new ValidationError(
        'A sala atingiu o limite máximo de 16 jogadores.'
      );
    }

    const duplicate = room.players.some(
      (p) => normalizeDesenhoText(p.nickname) === normalizeDesenhoText(cleanNick)
    );
    if (duplicate) {
      throw new ValidationError(
        'Já existe um jogador com esse apelido nesta sala.'
      );
    }

    this.playerIdCounter += 1;
    const playerId = `desenho-player-${this.playerIdCounter}`;
    const newPlayer: DesenhoPlayer = {
      id: playerId,
      nickname: cleanNick,
      isHost: false,
      score: 0,
      drawingScore: 0,
      firstGuessCount: 0,
      hasGuessedCurrentTurn: false,
    };

    const updated: DesenhoRoom = {
      ...room,
      players: [...room.players, newPlayer],
    };
    this.activeDesenhoRoomId = room.id;
    this.localPlayerIdByRoom.set(room.id, playerId);
    return this.saveAndNotifyDesenho(updated, playerId);
  }

  async leaveDesenhoRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.desenhoRooms.get(roomId);
    if (!room) return;
    const remaining = room.players.filter((p) => p.id !== playerId);
    if (remaining.length === 0) {
      this.desenhoRooms.delete(roomId);
      this.desenhoSecretsByRoom.delete(roomId);
      this.desenhoListeners.delete(roomId);
      return;
    }

    let nextHostId = room.hostId;
    const updatedPlayers = remaining.map((p, index) => {
      if (room.hostId === playerId && index === 0) {
        nextHostId = p.id;
        return { ...p, isHost: true };
      }
      return { ...p };
    });

    const drawerLeft =
      room.phase === 'drawing' && room.currentDrawerId === playerId;
    const nextPhase =
      room.phase !== 'lobby' && updatedPlayers.length < 2
        ? 'finished'
        : drawerLeft
          ? 'turn_summary'
          : room.phase;

    const updated: DesenhoRoom = {
      ...room,
      hostId: nextHostId,
      phase: nextPhase,
      phaseEndsAt: nextPhase === 'drawing' ? room.phaseEndsAt : null,
      drawerOrder: room.drawerOrder.filter((id) => id !== playerId),
      players: updatedPlayers,
    };
    this.saveAndNotifyDesenho(updated);
  }

  async updateDesenhoConfig(
    roomId: string,
    partialConfig: Partial<DesenhoConfig>
  ): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    const updated: DesenhoRoom = {
      ...room,
      config: {
        turnDurationSeconds:
          partialConfig.turnDurationSeconds ?? room.config.turnDurationSeconds,
        totalRounds: partialConfig.totalRounds ?? room.config.totalRounds,
        categories: partialConfig.categories
          ? [...partialConfig.categories]
          : [...room.config.categories],
      },
    };
    return this.saveAndNotifyDesenho(updated);
  }

  async startDesenhoTurn(
    roomId: string,
    input: StartDesenhoTurnInput
  ): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    this.desenhoSecretsByRoom.set(room.id, input.secretWord);

    const updated: DesenhoRoom = {
      ...room,
      phase: 'drawing',
      phaseEndsAt: input.phaseEndsAt,
      currentRound: input.currentRound,
      drawerOrder: [...input.drawerOrder],
      currentDrawerIndex: input.currentDrawerIndex,
      currentDrawerId: input.drawerId,
      currentCardCategory: input.category,
      currentSecretWord: input.secretWord,
      usedCardIds: [...input.usedCardIds],
      elements: [],
      guesses: [],
      players: room.players.map((p) => ({
        ...p,
        hasGuessedCurrentTurn: false,
      })),
    };
    return this.saveAndNotifyDesenho(updated);
  }

  async addDesenhoElement(
    roomId: string,
    drawerId: string,
    element: DrawingElement
  ): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    if (room.phase !== 'drawing') {
      throw new ConflictError('Não é possível desenhar fora da fase ativa.');
    }
    if (room.currentDrawerId !== drawerId) {
      throw new ValidationError('Apenas o desenhista da vez pode desenhar.');
    }
    const updated: DesenhoRoom = {
      ...room,
      elements: [...room.elements, cloneDrawingElement(element)],
    };
    return this.saveAndNotifyDesenho(updated, drawerId);
  }

  async undoDesenhoElement(
    roomId: string,
    drawerId: string
  ): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    if (room.phase !== 'drawing') {
      return this.projectDesenhoRoomForViewer(room, drawerId);
    }
    if (room.currentDrawerId !== drawerId) {
      throw new ValidationError(
        'Apenas o desenhista da vez pode desfazer traços.'
      );
    }
    if (room.elements.length === 0) {
      return this.projectDesenhoRoomForViewer(room, drawerId);
    }
    const updated: DesenhoRoom = {
      ...room,
      elements: room.elements.slice(0, -1),
    };
    return this.saveAndNotifyDesenho(updated, drawerId);
  }

  async clearDesenhoCanvas(
    roomId: string,
    drawerId: string
  ): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    if (room.phase !== 'drawing') {
      return this.projectDesenhoRoomForViewer(room, drawerId);
    }
    if (room.currentDrawerId !== drawerId) {
      throw new ValidationError(
        'Apenas o desenhista da vez pode limpar a folha.'
      );
    }
    const updated: DesenhoRoom = {
      ...room,
      elements: [],
    };
    return this.saveAndNotifyDesenho(updated, drawerId);
  }

  async submitDesenhoGuess(
    roomId: string,
    playerId: string,
    text: string
  ): Promise<SubmitDesenhoGuessResult> {
    const room = this.resolveDesenhoRoom(roomId);
    if (room.phase !== 'drawing') {
      throw new ValidationError(
        'A sala não está aceitando palpites neste momento.'
      );
    }
    if (room.currentDrawerId === playerId) {
      throw new ValidationError('O desenhista da vez não pode enviar palpites.');
    }
    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new ValidationError('Jogador não encontrado nesta sala.');
    }
    if (player.hasGuessedCurrentTurn) {
      throw new ValidationError('Você já acertou a palavra deste turno.');
    }
    const cleanText = text.trim();
    if (!cleanText) {
      throw new ValidationError('Digite um palpite antes de enviar.');
    }

    const secretWord =
      this.desenhoSecretsByRoom.get(room.id) ?? room.currentSecretWord ?? '';
    const isCorrect =
      normalizeDesenhoText(cleanText) === normalizeDesenhoText(secretWord);

    this.desenhoGuessCounter += 1;
    let pointsAwarded = 0;
    let drawerPoints = 0;
    let isFirstCorrect = false;

    if (isCorrect) {
      const priorCorrect = room.guesses.filter((g) => g.isCorrect).length;
      if (priorCorrect === 0) {
        pointsAwarded = 20;
        drawerPoints = 10;
        isFirstCorrect = true;
      } else if (priorCorrect === 1) {
        pointsAwarded = 15;
        drawerPoints = 5;
      } else {
        pointsAwarded = 10;
        drawerPoints = 5;
      }
    }

    const guessRecord: DesenhoGuess = {
      id: `guess-${this.desenhoGuessCounter}`,
      playerId: player.id,
      playerNickname: player.nickname,
      text: isCorrect ? 'Acertou a palavra!' : cleanText,
      isCorrect,
      pointsAwarded,
      createdAt: new Date().toISOString(),
    };

    const updatedPlayers = room.players.map((p) => {
      if (isCorrect && p.id === player.id) {
        return {
          ...p,
          score: p.score + pointsAwarded,
          firstGuessCount: p.firstGuessCount + (isFirstCorrect ? 1 : 0),
          hasGuessedCurrentTurn: true,
        };
      }
      if (isCorrect && p.id === room.currentDrawerId) {
        return {
          ...p,
          score: p.score + drawerPoints,
          drawingScore: p.drawingScore + drawerPoints,
        };
      }
      return { ...p };
    });

    const guessers = updatedPlayers.filter((p) => p.id !== room.currentDrawerId);
    const allGuessed =
      guessers.length > 0 && guessers.every((p) => p.hasGuessedCurrentTurn);

    const updated: DesenhoRoom = {
      ...room,
      phase: allGuessed ? 'turn_summary' : room.phase,
      phaseEndsAt: allGuessed ? null : room.phaseEndsAt,
      guesses: [...room.guesses, guessRecord],
      players: updatedPlayers,
    };

    const saved = this.saveAndNotifyDesenho(updated, playerId);
    return {
      room: saved,
      isCorrect,
      pointsAwarded,
    };
  }

  async finishDesenhoTurn(roomId: string): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    if (room.phase !== 'drawing') {
      return this.projectDesenhoRoomForViewer(room);
    }
    const updated: DesenhoRoom = {
      ...room,
      phase: 'turn_summary',
      phaseEndsAt: null,
    };
    return this.saveAndNotifyDesenho(updated);
  }

  async finishDesenhoMatch(roomId: string): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    const updated: DesenhoRoom = {
      ...room,
      phase: 'finished',
      phaseEndsAt: null,
    };
    return this.saveAndNotifyDesenho(updated);
  }

  async restartDesenhoLobby(roomId: string): Promise<DesenhoRoom> {
    const room = this.resolveDesenhoRoom(roomId);
    this.desenhoSecretsByRoom.set(room.id, null);
    const updated: DesenhoRoom = {
      ...room,
      phase: 'lobby',
      phaseEndsAt: null,
      currentRound: 1,
      drawerOrder: [],
      currentDrawerIndex: 0,
      currentDrawerId: null,
      currentCardCategory: null,
      currentSecretWord: null,
      usedCardIds: [],
      elements: [],
      guesses: [],
      players: room.players.map((p) => ({
        ...p,
        score: 0,
        drawingScore: 0,
        firstGuessCount: 0,
        hasGuessedCurrentTurn: false,
      })),
    };
    return this.saveAndNotifyDesenho(updated);
  }

  subscribeToDesenhoRoom(
    roomId: string,
    onRoomUpdated: (room: DesenhoRoom) => void
  ): () => void {
    const listeners = this.desenhoListeners.get(roomId) ?? new Set();
    listeners.add(onRoomUpdated);
    this.desenhoListeners.set(roomId, listeners);

    return () => {
      const current = this.desenhoListeners.get(roomId);
      if (!current) return;
      current.delete(onRoomUpdated);
      if (current.size === 0) {
        this.desenhoListeners.delete(roomId);
      }
    };
  }
}
