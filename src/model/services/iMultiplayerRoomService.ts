import type {
  DesenhoCategory,
  DrawingElement,
} from '@/model/entities/drawingChallenge';
import type {
  AdedonhaConfig,
  AdedonhaPhase,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
  CidadeDormeConfig,
  CidadeDormeRole,
  CidadeDormeRoom,
  DesenhoConfig,
  DesenhoRoom,
} from '@/model/entities/multiplayerSession';

export type StartDesenhoTurnInput = {
  drawerId: string;
  drawerOrder: string[];
  currentDrawerIndex: number;
  currentRound: number;
  cardId: string;
  secretWord: string;
  category: DesenhoCategory;
  usedCardIds: string[];
  phaseEndsAt: string;
};

export type SubmitDesenhoGuessResult = {
  room: DesenhoRoom;
  isCorrect: boolean;
  pointsAwarded: number;
};

export interface IMultiplayerRoomService {
  getLocalPlayerId(roomId?: string): Promise<string | null>;
  getAdedonhaRoom(roomId?: string): Promise<AdedonhaRoom>;
  createAdedonhaRoom(
    hostNickname: string,
    initialColumns?: string[]
  ): Promise<AdedonhaRoom>;
  joinAdedonhaRoom(code: string, nickname: string): Promise<AdedonhaRoom>;
  leaveAdedonhaRoom(roomId: string, playerId: string): Promise<void>;
  updateAdedonhaColumns(roomId: string, columns: string[]): Promise<AdedonhaRoom>;
  updateAdedonhaConfig(
    roomId: string,
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ): Promise<AdedonhaRoom>;
  spinAlphabetRoulette(
    roomId: string,
    drawnLetter: string
  ): Promise<AdedonhaRoom>;
  openRoundFilling(
    roomId: string,
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom>;
  submitPlayerAnswers(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom>;
  triggerAdedonhaStop(
    roomId: string,
    playerId: string
  ): Promise<AdedonhaRoom>;
  startTallyPhase(
    roomId: string,
    classifiedSubmissions: AdedonhaSubmission[],
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom>;
  raiseDoubt(roomId: string, submissionId: string): Promise<AdedonhaRoom>;
  judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict,
    points: number
  ): Promise<AdedonhaRoom>;
  advanceTallyColumn(roomId: string): Promise<AdedonhaRoom>;
  advanceToNextRound(
    roomId: string,
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom>;
  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: AdedonhaRoom) => void
  ): () => void;
  getCidadeDormeRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<CidadeDormeRoom>;
  createCidadeDormeRoom(hostNickname: string): Promise<CidadeDormeRoom>;
  joinCidadeDormeRoom(code: string, nickname: string): Promise<CidadeDormeRoom>;
  leaveCidadeDormeRoom(roomId: string, playerId: string): Promise<void>;
  updateCidadeDormeConfig(
    roomId: string,
    partialConfig: Partial<CidadeDormeConfig>
  ): Promise<CidadeDormeRoom>;
  saveCidadeDormeRoom(room: CidadeDormeRoom): Promise<CidadeDormeRoom>;
  startCidadeDormeMatch(
    roomId: string,
    assignedRolesByPlayerId: Record<string, CidadeDormeRole>,
    narratorCaption: string
  ): Promise<CidadeDormeRoom>;
  markCidadeDormePlayerReady(
    roomId: string,
    playerId: string,
    options?: {
      markCompanionsReady?: boolean;
      nightTurnEndsAt?: string | null;
      nightCaption?: string;
    }
  ): Promise<CidadeDormeRoom>;
  submitCidadeDormeNightAction(
    roomId: string,
    actorPlayerId: string,
    kind: 'night_assassin' | 'night_angel' | 'night_detective',
    targetPlayerId: string | null
  ): Promise<CidadeDormeRoom>;
  submitCidadeDormeVote(
    roomId: string,
    voterPlayerId: string,
    targetPlayerIdOrSkip: string
  ): Promise<CidadeDormeRoom>;
  resolveCidadeDormeDawn(
    roomId: string,
    options?: {
      debateEndsAt?: string | null;
    }
  ): Promise<CidadeDormeRoom>;
  tallyCidadeDormeVotes(roomId: string): Promise<CidadeDormeRoom>;
  subscribeToCidadeDormeRoom(
    roomId: string,
    onRoomUpdated: (room: CidadeDormeRoom) => void
  ): () => void;
  getDesenhoRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<DesenhoRoom>;
  createDesenhoRoom(
    hostNickname: string,
    initialCategories?: DesenhoCategory[]
  ): Promise<DesenhoRoom>;
  joinDesenhoRoom(code: string, nickname: string): Promise<DesenhoRoom>;
  leaveDesenhoRoom(roomId: string, playerId: string): Promise<void>;
  updateDesenhoConfig(
    roomId: string,
    partialConfig: Partial<DesenhoConfig>
  ): Promise<DesenhoRoom>;
  startDesenhoTurn(
    roomId: string,
    input: StartDesenhoTurnInput
  ): Promise<DesenhoRoom>;
  addDesenhoElement(
    roomId: string,
    drawerId: string,
    element: DrawingElement
  ): Promise<DesenhoRoom>;
  undoDesenhoElement(roomId: string, drawerId: string): Promise<DesenhoRoom>;
  clearDesenhoCanvas(roomId: string, drawerId: string): Promise<DesenhoRoom>;
  submitDesenhoGuess(
    roomId: string,
    playerId: string,
    text: string
  ): Promise<SubmitDesenhoGuessResult>;
  finishDesenhoTurn(
    roomId: string,
    reason?: 'timeout' | 'all_guessed' | 'drawer_left'
  ): Promise<DesenhoRoom>;
  finishDesenhoMatch(roomId: string): Promise<DesenhoRoom>;
  restartDesenhoLobby(roomId: string): Promise<DesenhoRoom>;
  subscribeToDesenhoRoom(
    roomId: string,
    onRoomUpdated: (room: DesenhoRoom) => void
  ): () => void;
}
