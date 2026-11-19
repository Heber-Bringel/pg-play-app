import type {
  AdedonhaConfig,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
  CidadeDormeConfig,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';

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
  openRoundFilling(roomId: string): Promise<AdedonhaRoom>;
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
    classifiedSubmissions: AdedonhaSubmission[]
  ): Promise<AdedonhaRoom>;
  raiseDoubt(roomId: string, submissionId: string): Promise<AdedonhaRoom>;
  judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict,
    points: number
  ): Promise<AdedonhaRoom>;
  advanceTallyColumn(roomId: string): Promise<AdedonhaRoom>;
  advanceToNextRound(roomId: string): Promise<AdedonhaRoom>;
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
}
