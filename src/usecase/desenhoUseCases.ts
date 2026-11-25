import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type {
  DesenhoCard,
  DesenhoCategory,
  DrawingElement,
  DrawingElementDraft,
} from '@/model/entities/drawingChallenge';
import type {
  DesenhoAwards,
  DesenhoConfig,
  DesenhoPlayer,
  DesenhoRoom,
} from '@/model/entities/multiplayerSession';
import { ValidationError } from '@/model/errors';
import type {
  IMultiplayerRoomService,
  SubmitDesenhoGuessResult,
} from '@/model/services/iMultiplayerRoomService';
import type { IDesenhoUseCases } from '@/usecase/iDesenhoUseCases';

export const DESENHO_MIN_PLAYERS = 2;
export const DESENHO_MAX_PLAYERS = 16;
export const DESENHO_THEME_REVEAL_SECONDS = 5;
export const DESENHO_THEME_PEEK_SECONDS = 3;

const VALID_DURATIONS = new Set<number>([60, 90, 120]);
const VALID_CATEGORIES = new Set<DesenhoCategory>([
  'Bíblico',
  'Animais',
  'Objetos',
  'Comidas',
  'Lugares e Natureza',
]);

export function normalizeDesenhoGuessText(text: string): string {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export class DesenhoUseCases implements IDesenhoUseCases {
  private elementCounter = 0;

  constructor(
    private readonly roomService: IMultiplayerRoomService,
    private readonly catalogDataSource: IGameCatalogDataSource
  ) {}

  async getLocalPlayerId(roomId?: string): Promise<string | null> {
    return this.roomService.getLocalPlayerId(roomId);
  }

  async getRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<DesenhoRoom> {
    return this.roomService.getDesenhoRoom(roomId, viewerPlayerId);
  }

  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: DesenhoRoom) => void
  ): () => void {
    return this.roomService.subscribeToDesenhoRoom(roomId, onRoomUpdated);
  }

  async createRoom(
    hostNickname: string,
    initialCategories?: DesenhoCategory[]
  ): Promise<DesenhoRoom> {
    const cleanHost = hostNickname.trim();
    if (cleanHost.length < 2) {
      throw new ValidationError(
        'Digite um apelido com pelo menos 2 letras para criar a sala.'
      );
    }
    if (cleanHost.length > 20) {
      throw new ValidationError(
        'O apelido do jogador deve ter no máximo 20 caracteres.'
      );
    }
    if (initialCategories !== undefined) {
      this.validateCategories(initialCategories);
    }
    return this.roomService.createDesenhoRoom(cleanHost, initialCategories);
  }

  async joinRoom(code: string, nickname: string): Promise<DesenhoRoom> {
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
    if (cleanNickname.length > 20) {
      throw new ValidationError(
        'O apelido do jogador deve ter no máximo 20 caracteres.'
      );
    }
    return this.roomService.joinDesenhoRoom(cleanCode, cleanNickname);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    if (!roomId.trim() || !playerId.trim()) {
      return;
    }
    await this.roomService.leaveDesenhoRoom(roomId, playerId);
  }

  async updateConfig(
    roomId: string,
    partialConfig: Partial<DesenhoConfig>
  ): Promise<DesenhoRoom> {
    if (
      partialConfig.turnDurationSeconds !== undefined &&
      !VALID_DURATIONS.has(partialConfig.turnDurationSeconds)
    ) {
      throw new ValidationError(
        'O tempo por turno do Desenho Relâmpago deve ser 60s, 90s ou 120s.'
      );
    }
    if (
      partialConfig.totalRounds !== undefined &&
      (!Number.isInteger(partialConfig.totalRounds) ||
        partialConfig.totalRounds < 1 ||
        partialConfig.totalRounds > 5)
    ) {
      throw new ValidationError(
        'O número de rodadas do Desenho Relâmpago deve estar entre 1 e 5.'
      );
    }
    if (partialConfig.categories !== undefined) {
      this.validateCategories(partialConfig.categories);
    }
    return this.roomService.updateDesenhoConfig(roomId, partialConfig);
  }

  async startMatch(roomId: string): Promise<DesenhoRoom> {
    const room = await this.roomService.getDesenhoRoom(roomId);
    if (room.players.length < DESENHO_MIN_PLAYERS) {
      throw new ValidationError(
        'O Desenho Relâmpago precisa de pelo menos 2 jogadores na sala.'
      );
    }
    if (room.players.length > DESENHO_MAX_PLAYERS) {
      throw new ValidationError(
        'O Desenho Relâmpago suporta no máximo 16 jogadores por sala.'
      );
    }
    this.validateCategories(room.config.categories);

    const cards = await this.catalogDataSource.listDesenhoCards(
      room.config.categories
    );
    if (cards.length === 0) {
      throw new ValidationError(
        'Nenhuma palavra desenhável encontrada nos pacotes selecionados.'
      );
    }

    const firstCard = cards[0];
    const drawerOrder = room.players.map((p) => p.id);
    const phaseEndsAt = new Date(
      Date.now() + room.config.turnDurationSeconds * 1000
    ).toISOString();

    return this.roomService.startDesenhoTurn(room.id, {
      drawerId: drawerOrder[0],
      drawerOrder,
      currentDrawerIndex: 0,
      currentRound: 1,
      cardId: firstCard.id,
      secretWord: firstCard.word,
      category: firstCard.category,
      usedCardIds: [firstCard.id],
      phaseEndsAt,
    });
  }

  async addElement(
    roomId: string,
    drawerId: string,
    draft: DrawingElementDraft
  ): Promise<DesenhoRoom> {
    if (!drawerId.trim()) {
      throw new ValidationError('Desenhista inválido.');
    }

    let element: DrawingElement;
    this.elementCounter += 1;
    const id = `el-${Date.now()}-${this.elementCounter}`;

    if (draft.tool === 'freehand') {
      if (draft.points.length === 0) {
        throw new ValidationError('O traço precisa conter ao menos 1 ponto.');
      }
      element = {
        id,
        tool: 'freehand',
        points: draft.points.map((p) => ({ x: p.x, y: p.y })),
        colorId: draft.colorId,
        widthId: draft.widthId,
      };
    } else {
      const dx = Math.abs(draft.end.x - draft.start.x);
      const dy = Math.abs(draft.end.y - draft.start.y);
      if (dx < 2 && dy < 2) {
        throw new ValidationError(
          'Arraste na folha para definir o tamanho da forma.'
        );
      }
      element = {
        id,
        tool: draft.tool,
        start: { x: draft.start.x, y: draft.start.y },
        end: { x: draft.end.x, y: draft.end.y },
        fillMode: draft.tool === 'line' ? 'stroke' : draft.fillMode,
        colorId: draft.colorId,
        widthId: draft.widthId,
      };
    }

    return this.roomService.addDesenhoElement(roomId, drawerId, element);
  }

  async undoElement(roomId: string, drawerId: string): Promise<DesenhoRoom> {
    return this.roomService.undoDesenhoElement(roomId, drawerId);
  }

  async clearCanvas(roomId: string, drawerId: string): Promise<DesenhoRoom> {
    return this.roomService.clearDesenhoCanvas(roomId, drawerId);
  }

  async submitGuess(
    roomId: string,
    playerId: string,
    text: string
  ): Promise<SubmitDesenhoGuessResult> {
    const cleanText = text.trim();
    if (!cleanText) {
      throw new ValidationError('Digite um palpite antes de enviar.');
    }
    return this.roomService.submitDesenhoGuess(roomId, playerId, cleanText);
  }

  async finishTurn(
    roomId: string,
    reason?: 'timeout' | 'all_guessed' | 'drawer_left'
  ): Promise<DesenhoRoom> {
    return this.roomService.finishDesenhoTurn(roomId, reason);
  }

  async advanceTurn(roomId: string): Promise<DesenhoRoom> {
    const room = await this.roomService.getDesenhoRoom(roomId);
    if (room.players.length < DESENHO_MIN_PLAYERS) {
      return this.roomService.finishDesenhoMatch(room.id);
    }

    const activePlayerIds = new Set(room.players.map((p) => p.id));
    const drawerOrder =
      room.drawerOrder.filter((id) => activePlayerIds.has(id)).length > 0
        ? room.drawerOrder.filter((id) => activePlayerIds.has(id))
        : room.players.map((p) => p.id);

    let nextDrawerIndex = room.currentDrawerIndex + 1;
    let nextRound = room.currentRound;

    if (nextDrawerIndex >= drawerOrder.length) {
      nextDrawerIndex = 0;
      nextRound += 1;
    }

    if (nextRound > room.config.totalRounds) {
      return this.roomService.finishDesenhoMatch(room.id);
    }

    const cards = await this.catalogDataSource.listDesenhoCards(
      room.config.categories
    );
    const usedSet = new Set(room.usedCardIds);
    const nextCard: DesenhoCard | undefined = cards.find(
      (c) => !usedSet.has(c.id)
    );

    if (!nextCard) {
      return this.roomService.finishDesenhoMatch(room.id);
    }

    const phaseEndsAt = new Date(
      Date.now() + room.config.turnDurationSeconds * 1000
    ).toISOString();

    return this.roomService.startDesenhoTurn(room.id, {
      drawerId: drawerOrder[nextDrawerIndex],
      drawerOrder,
      currentDrawerIndex: nextDrawerIndex,
      currentRound: nextRound,
      cardId: nextCard.id,
      secretWord: nextCard.word,
      category: nextCard.category,
      usedCardIds: [...room.usedCardIds, nextCard.id],
      phaseEndsAt,
    });
  }

  async restartLobby(roomId: string): Promise<DesenhoRoom> {
    return this.roomService.restartDesenhoLobby(roomId);
  }

  getRankedPlayers(room: DesenhoRoom): DesenhoPlayer[] {
    return [...room.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.drawingScore !== a.drawingScore) {
        return b.drawingScore - a.drawingScore;
      }
      if (b.firstGuessCount !== a.firstGuessCount) {
        return b.firstGuessCount - a.firstGuessCount;
      }
      return a.nickname.localeCompare(b.nickname, 'pt-BR');
    });
  }

  getAwards(room: DesenhoRoom): DesenhoAwards {
    const ranked = this.getRankedPlayers(room);
    const generalChampion = ranked[0] ?? null;

    const bestArtist =
      [...room.players].sort((a, b) => {
        if (b.drawingScore !== a.drawingScore) {
          return b.drawingScore - a.drawingScore;
        }
        return b.score - a.score;
      })[0] ?? null;

    const eagleEye =
      [...room.players].sort((a, b) => {
        if (b.firstGuessCount !== a.firstGuessCount) {
          return b.firstGuessCount - a.firstGuessCount;
        }
        return b.score - a.score;
      })[0] ?? null;

    return {
      generalChampion,
      bestArtist: bestArtist && bestArtist.drawingScore > 0 ? bestArtist : null,
      eagleEye: eagleEye && eagleEye.firstGuessCount > 0 ? eagleEye : null,
    };
  }

  private validateCategories(categories: DesenhoCategory[]): void {
    if (categories.length === 0) {
      throw new ValidationError(
        'Selecione pelo menos 1 pacote de palavras desenháveis.'
      );
    }
    const hasInvalid = categories.some((c) => !VALID_CATEGORIES.has(c));
    if (hasInvalid) {
      throw new ValidationError('Categoria de Desenho Relâmpago inválida.');
    }
  }
}
