import type {
  AdedonhaConfig,
  AdedonhaPlayer,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
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

export class MemoryMultiplayerRoomService implements IMultiplayerRoomService {
  private rooms: Map<string, AdedonhaRoom> = new Map();
  private activeRoomId: string;

  constructor(initialRoom?: AdedonhaRoom) {
    const seedRoom = initialRoom ? cloneRoom(initialRoom) : createDefaultRoom();
    this.rooms.set(seedRoom.id, seedRoom);
    this.activeRoomId = seedRoom.id;
  }

  private resolveRoom(roomId?: string): AdedonhaRoom {
    const targetId = roomId ?? this.activeRoomId;
    const room = this.rooms.get(targetId);
    if (!room) {
      throw new DataSourceError('Sala multiplayer não encontrada.');
    }
    return room;
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
      this.rooms.set(id, room);
      this.activeRoomId = id;
      return cloneRoom(room);
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

    const newPlayer: AdedonhaPlayer = {
      id: `player-${found.players.length + 1}`,
      nickname: nickname.trim(),
      isHost: false,
      score: 0,
      stopCount: 0,
      uniqueAnswersCount: 0,
    };

    const updated: AdedonhaRoom = {
      ...found,
      players: [...found.players, newPlayer],
    };
    this.rooms.set(found.id, updated);
    this.activeRoomId = found.id;
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
  }

  async openRoundFilling(roomId: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    const updated: AdedonhaRoom = {
      ...room,
      phase: 'filling',
    };
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
  }

  async advanceToNextRound(roomId: string): Promise<AdedonhaRoom> {
    const room = this.resolveRoom(roomId);
    if (room.currentRound >= room.config.totalRounds) {
      const finished: AdedonhaRoom = {
        ...room,
        phase: 'finished',
      };
      this.rooms.set(room.id, finished);
      return cloneRoom(finished);
    }

    const updated: AdedonhaRoom = {
      ...room,
      phase: 'lobby',
      currentRound: room.currentRound + 1,
      currentLetter: null,
      currentTallyColumnIndex: 0,
      stopTriggeredBy: null,
    };
    this.rooms.set(room.id, updated);
    return cloneRoom(updated);
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
}
