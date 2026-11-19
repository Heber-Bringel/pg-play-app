import type {
  AdedonhaConfig,
  AdedonhaPlayer,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
  CidadeDormeConfig,
  CidadeDormePlayer,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { DataSourceError } from '@/model/errors';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';

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
    config: {
      narratorVoice: 'masculina',
      assassinCount: 1,
      dayDebateSeconds: 120,
      nightTurnSeconds: 15,
      revealRoleOnDeath: true,
    },
    currentRound: 1,
    narratorCaption:
      'Sala pronta no Lobby. Configure a voz do Narrador e inicie quando todos estiverem na roda.',
    players: createDefaultCidadeDormePlayers(),
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
  private playerIdCounter = 100;

  constructor(
    initialRoom?: AdedonhaRoom,
    initialCidadeDormeRoom?: CidadeDormeRoom
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
    this.rooms.set(room.id, room);
    const snapshot = cloneRoom(room);
    const roomListeners = this.listeners.get(room.id);
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

  async openRoundFilling(roomId: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const updated: AdedonhaRoom = {
      ...room,
      phase: 'filling',
    };
    return this.saveAndNotify(updated);
  }

  async submitPlayerAnswers(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
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
      stopTriggeredBy: player.nickname,
      players: updatedPlayers,
    };
    return this.saveAndNotify(updated);
  }

  async startTallyPhase(
    roomId: string,
    classifiedSubmissions: AdedonhaSubmission[]
  ): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const recalculatedPlayers = this.recalculatePlayersScore(
      room.players,
      classifiedSubmissions
    );

    const updated: AdedonhaRoom = {
      ...room,
      phase: 'tally',
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

  async advanceToNextRound(roomId: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
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

  private resolveCidadeDormeRoom(roomId?: string): CidadeDormeRoom {
    const targetId = roomId ?? this.activeCidadeDormeRoomId;
    const room = this.cidadeDormeRooms.get(targetId);
    if (!room) {
      throw new DataSourceError('Sala de Cidade Dorme não encontrada.');
    }
    return room;
  }

  private saveAndNotifyCidadeDorme(room: CidadeDormeRoom): CidadeDormeRoom {
    this.cidadeDormeRooms.set(room.id, room);
    const snapshot = cloneCidadeDormeRoom(room);
    const roomListeners = this.cidadeDormeListeners.get(room.id);
    if (roomListeners) {
      roomListeners.forEach((listener) =>
        listener(cloneCidadeDormeRoom(snapshot))
      );
    }
    return snapshot;
  }

  async getCidadeDormeRoom(roomId?: string): Promise<CidadeDormeRoom> {
    const room = this.resolveCidadeDormeRoom(roomId);
    return cloneCidadeDormeRoom(room);
  }

  async createCidadeDormeRoom(hostNickname: string): Promise<CidadeDormeRoom> {
    try {
      const id = `room-cd-${Date.now()}`;
      const code = `CD${String(this.cidadeDormeRooms.size + 1000).slice(-4)}`;
      const room: CidadeDormeRoom = {
        id,
        code,
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
        narratorCaption:
          'Sala criada! Escolha a voz do Narrador e aguarde os jogadores entrarem na roda.',
        players: createDefaultCidadeDormePlayers(hostNickname.trim()),
        nightTargetId: null,
        nightProtectedId: null,
        detectiveVerdict: null,
        votesByPlayerId: {},
        dawnReport: null,
        voteReport: null,
        winner: null,
      };
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
      return cloneCidadeDormeRoom(found);
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

    const updated: CidadeDormeRoom = {
      ...found,
      players: [...found.players, newPlayer],
    };
    this.activeCidadeDormeRoomId = found.id;
    this.localPlayerIdByRoom.set(found.id, newPlayer.id);
    return this.saveAndNotifyCidadeDorme(updated);
  }

  async leaveCidadeDormeRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.cidadeDormeRooms.get(roomId);
    if (!room) return;
    if (this.localPlayerIdByRoom.get(roomId) === playerId) {
      this.localPlayerIdByRoom.delete(roomId);
    }
    if (room.phase === 'lobby' && playerId !== room.hostId) {
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
    const room = this.resolveCidadeDormeRoom(roomId);
    const updated: CidadeDormeRoom = {
      ...room,
      config: {
        ...room.config,
        ...partialConfig,
      },
    };
    return this.saveAndNotifyCidadeDorme(updated);
  }

  async saveCidadeDormeRoom(room: CidadeDormeRoom): Promise<CidadeDormeRoom> {
    this.resolveCidadeDormeRoom(room.id);
    return this.saveAndNotifyCidadeDorme(cloneCidadeDormeRoom(room));
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
}
