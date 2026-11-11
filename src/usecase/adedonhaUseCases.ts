import type {
  AdedonhaAwards,
  AdedonhaConfig,
  AdedonhaPlayer,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
} from '@/model/entities/multiplayerSession';
import { ValidationError } from '@/model/errors';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';
import type { IAdedonhaUseCases } from '@/usecase/iAdedonhaUseCases';

export const ADEDONHA_UNIQUE_POINTS = 10;
export const ADEDONHA_REPEATED_POINTS = 5;
export const ADEDONHA_INVALID_POINTS = 0;

export const SUGGESTED_BIBLICAL_COLUMNS: string[] = [
  'Personagem Bíblico',
  'Livro da Bíblia',
  'Cidade, Monte ou Rio Bíblico',
  'Rei, Profeta ou Apóstolo',
  'Objeto, Alimento ou Animal na Bíblia',
  'Atributo de Deus / Palavra de Fé',
  'Milagre ou Parábola',
];

const FULL_ALPHABET: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const HARD_LETTERS: Set<string> = new Set(['K', 'W', 'Y']);

export function normalizeBiblicalText(text: string): string {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export class AdedonhaUseCases implements IAdedonhaUseCases {
  constructor(private readonly roomService: IMultiplayerRoomService) {}

  getSuggestedColumns(): string[] {
    return [...SUGGESTED_BIBLICAL_COLUMNS];
  }

  async getRoom(roomId?: string): Promise<AdedonhaRoom> {
    return this.roomService.getAdedonhaRoom(roomId);
  }

  async createRoom(
    hostNickname: string,
    initialColumns?: string[]
  ): Promise<AdedonhaRoom> {
    const cleanHost = hostNickname.trim();
    if (cleanHost.length < 2) {
      throw new ValidationError(
        'Digite um apelido com pelo menos 2 letras para o Moderador.'
      );
    }
    if (initialColumns !== undefined && initialColumns.length === 0) {
      throw new ValidationError(
        'A sala deve iniciar com pelo menos 1 coluna bíblica.'
      );
    }
    return this.roomService.createAdedonhaRoom(cleanHost, initialColumns);
  }

  async joinRoom(code: string, nickname: string): Promise<AdedonhaRoom> {
    const cleanCode = code.trim().toUpperCase();
    const cleanNickname = nickname.trim();
    if (cleanCode.length < 4) {
      throw new ValidationError('Informe um código PIN válido para a sala.');
    }
    if (cleanNickname.length < 2) {
      throw new ValidationError(
        'Digite um apelido com pelo menos 2 letras para entrar na sala.'
      );
    }
    return this.roomService.joinAdedonhaRoom(cleanCode, cleanNickname);
  }

  async addColumn(roomId: string, columnName: string): Promise<AdedonhaRoom> {
    const cleanColumn = columnName.trim();
    if (cleanColumn.length < 2) {
      throw new ValidationError(
        'O nome da coluna deve ter pelo menos 2 caracteres.'
      );
    }
    if (cleanColumn.length > 40) {
      throw new ValidationError(
        'O nome da coluna deve ter no máximo 40 caracteres.'
      );
    }

    const room = await this.roomService.getAdedonhaRoom(roomId);
    if (room.config.columns.length >= 8) {
      throw new ValidationError(
        'A partida permite no máximo 8 colunas por rodada.'
      );
    }

    const normalizedNew = normalizeBiblicalText(cleanColumn);
    const alreadyExists = room.config.columns.some(
      (col) => normalizeBiblicalText(col) === normalizedNew
    );
    if (alreadyExists) {
      throw new ValidationError('Esta coluna já foi adicionada à partida.');
    }

    const updatedColumns = [...room.config.columns, cleanColumn];
    return this.roomService.updateAdedonhaColumns(room.id, updatedColumns);
  }

  async removeColumn(
    roomId: string,
    columnName: string
  ): Promise<AdedonhaRoom> {
    const room = await this.roomService.getAdedonhaRoom(roomId);
    if (room.config.columns.length <= 1) {
      throw new ValidationError(
        'A partida precisa manter pelo menos 1 coluna ativa.'
      );
    }

    const normalizedTarget = normalizeBiblicalText(columnName);
    const updatedColumns = room.config.columns.filter(
      (col) => normalizeBiblicalText(col) !== normalizedTarget
    );

    if (updatedColumns.length === room.config.columns.length) {
      throw new ValidationError('Coluna não encontrada na configuração atual.');
    }

    return this.roomService.updateAdedonhaColumns(room.id, updatedColumns);
  }

  async updateConfig(
    roomId: string,
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ): Promise<AdedonhaRoom> {
    return this.roomService.updateAdedonhaConfig(roomId, partialConfig);
  }

  getAvailableLetters(room: AdedonhaRoom): string[] {
    const usedSet = new Set(room.usedLetters.map((l) => l.toUpperCase()));
    return FULL_ALPHABET.filter((letter) => {
      if (usedSet.has(letter)) return false;
      if (room.config.excludeHardLetters && HARD_LETTERS.has(letter)) {
        return false;
      }
      return true;
    });
  }

  async spinRoulette(
    roomId: string,
    preferredLetter?: string
  ): Promise<AdedonhaRoom> {
    const room = await this.roomService.getAdedonhaRoom(roomId);
    if (room.config.columns.length === 0) {
      throw new ValidationError(
        'Configure pelo menos 1 coluna bíblica antes de girar a roleta.'
      );
    }

    const available = this.getAvailableLetters(room);
    if (available.length === 0) {
      throw new ValidationError(
        'Todas as letras disponíveis já foram sorteadas nesta partida.'
      );
    }

    let chosenLetter: string;
    if (preferredLetter !== undefined) {
      const cleanPreferred = normalizeBiblicalText(preferredLetter);
      if (!cleanPreferred || cleanPreferred.length !== 1) {
        throw new ValidationError('Letra informada para o sorteio é inválida.');
      }
      if (room.usedLetters.includes(cleanPreferred)) {
        throw new ValidationError(
          `A letra ${cleanPreferred} já foi sorteada em uma rodada anterior.`
        );
      }
      if (room.config.excludeHardLetters && HARD_LETTERS.has(cleanPreferred)) {
        throw new ValidationError(
          `A letra ${cleanPreferred} está desativada pelo filtro de letras difíceis.`
        );
      }
      chosenLetter = cleanPreferred;
    } else {
      const deterministicIndex =
        (room.currentRound - 1 + room.usedLetters.length) % available.length;
      chosenLetter = available[deterministicIndex];
    }

    await this.roomService.spinAlphabetRoulette(room.id, chosenLetter);
    return this.roomService.openRoundFilling(room.id);
  }

  validateAnswerInitial(
    answer: string,
    roundLetter: string | null
  ): string | null {
    const trimmed = answer.trim();
    if (!trimmed || !roundLetter) {
      return null;
    }

    const normalizedAnswer = normalizeBiblicalText(trimmed);
    const normalizedLetter = normalizeBiblicalText(roundLetter);

    if (!normalizedAnswer.startsWith(normalizedLetter)) {
      return `A resposta deve começar com a letra ${normalizedLetter}`;
    }

    return null;
  }

  canTriggerStop(
    columns: string[],
    answers: Record<string, string>,
    roundLetter: string | null
  ): boolean {
    if (!roundLetter || columns.length === 0) {
      return false;
    }

    return columns.every((col) => {
      const value = (answers[col] ?? '').trim();
      if (value.length < 2) return false;
      return this.validateAnswerInitial(value, roundLetter) === null;
    });
  }

  async triggerAdedonha(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom> {
    const room = await this.roomService.getAdedonhaRoom(roomId);
    if (!room.currentLetter) {
      throw new ValidationError(
        'Sorteie uma letra na Roleta Expressiva antes de acionar ADEDONHA!'
      );
    }

    for (const column of room.config.columns) {
      const rawAnswer = (answers[column] ?? '').trim();
      if (rawAnswer.length < 2) {
        throw new ValidationError(
          `Preencha a coluna "${column}" antes de pedir ADEDONHA!`
        );
      }
      const initialError = this.validateAnswerInitial(
        rawAnswer,
        room.currentLetter
      );
      if (initialError) {
        throw new ValidationError(`${column}: ${initialError}`);
      }
    }

    await this.roomService.submitPlayerAnswers(room.id, playerId, answers);
    const stoppedRoom = await this.roomService.triggerAdedonhaStop(
      room.id,
      playerId
    );
    const classified = this.classifySubmissions(
      stoppedRoom.submissions,
      stoppedRoom.currentRound,
      stoppedRoom.currentLetter
    );
    return this.roomService.startTallyPhase(room.id, classified);
  }

  async finishRoundByTimeOut(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom> {
    const room = await this.roomService.getAdedonhaRoom(roomId);
    if (!room.currentLetter) {
      throw new ValidationError('Nenhuma rodada em andamento para encerrar.');
    }

    const afterSubmit = await this.roomService.submitPlayerAnswers(
      room.id,
      playerId,
      answers
    );
    const classified = this.classifySubmissions(
      afterSubmit.submissions,
      afterSubmit.currentRound,
      afterSubmit.currentLetter
    );
    return this.roomService.startTallyPhase(room.id, classified);
  }

  async raiseDoubt(
    roomId: string,
    submissionId: string
  ): Promise<AdedonhaRoom> {
    if (!submissionId.trim()) {
      throw new ValidationError(
        'Identificador da resposta é obrigatório para levantar dúvida.'
      );
    }
    return this.roomService.raiseDoubt(roomId, submissionId.trim());
  }

  async judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict
  ): Promise<AdedonhaRoom> {
    if (!submissionId.trim()) {
      throw new ValidationError(
        'Identificador da resposta é obrigatório para o veredito do Moderador.'
      );
    }

    const points =
      verdict === 'unique'
        ? ADEDONHA_UNIQUE_POINTS
        : verdict === 'repeated'
        ? ADEDONHA_REPEATED_POINTS
        : ADEDONHA_INVALID_POINTS;

    return this.roomService.judgeSubmission(
      roomId,
      submissionId.trim(),
      verdict,
      points
    );
  }

  async advanceTallyColumn(roomId: string): Promise<AdedonhaRoom> {
    return this.roomService.advanceTallyColumn(roomId);
  }

  async advanceToNextRound(roomId: string): Promise<AdedonhaRoom> {
    return this.roomService.advanceToNextRound(roomId);
  }

  getAwards(room: AdedonhaRoom): AdedonhaAwards {
    if (room.players.length === 0) {
      return {
        generalChampion: null,
        fastestHand: null,
        rareVocabulary: null,
      };
    }

    const byScore: AdedonhaPlayer[] = [...room.players].sort(
      (a, b) => b.score - a.score
    );
    const byStop: AdedonhaPlayer[] = [...room.players].sort(
      (a, b) => b.stopCount - a.stopCount || b.score - a.score
    );
    const byUnique: AdedonhaPlayer[] = [...room.players].sort(
      (a, b) =>
        b.uniqueAnswersCount - a.uniqueAnswersCount || b.score - a.score
    );

    return {
      generalChampion: byScore[0] ?? null,
      fastestHand: byStop[0] ?? null,
      rareVocabulary: byUnique[0] ?? null,
    };
  }

  private classifySubmissions(
    submissions: AdedonhaSubmission[],
    roundNumber: number,
    roundLetter: string | null
  ): AdedonhaSubmission[] {
    const targetLetter = roundLetter
      ? normalizeBiblicalText(roundLetter)
      : '';

    const frequencyByColumnAndWord = new Map<string, number>();

    for (const sub of submissions) {
      if (sub.roundNumber !== roundNumber) continue;
      const normWord = normalizeBiblicalText(sub.answerText);
      const isValidInitial =
        normWord.length >= 2 &&
        targetLetter.length === 1 &&
        normWord.startsWith(targetLetter);

      if (isValidInitial) {
        const key = `${normalizeBiblicalText(sub.columnName)}::${normWord}`;
        frequencyByColumnAndWord.set(
          key,
          (frequencyByColumnAndWord.get(key) ?? 0) + 1
        );
      }
    }

    return submissions.map((sub) => {
      if (sub.roundNumber !== roundNumber) {
        return { ...sub };
      }

      const normWord = normalizeBiblicalText(sub.answerText);
      const isValidInitial =
        normWord.length >= 2 &&
        targetLetter.length === 1 &&
        normWord.startsWith(targetLetter);

      if (!isValidInitial) {
        return {
          ...sub,
          status: 'invalid',
          points: ADEDONHA_INVALID_POINTS,
        };
      }

      const key = `${normalizeBiblicalText(sub.columnName)}::${normWord}`;
      const count = frequencyByColumnAndWord.get(key) ?? 0;

      if (count === 1) {
        return {
          ...sub,
          status: 'unique',
          points: ADEDONHA_UNIQUE_POINTS,
        };
      }

      return {
        ...sub,
        status: 'repeated',
        points: ADEDONHA_REPEATED_POINTS,
      };
    });
  }
}
