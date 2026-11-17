import type {
  AdedonhaAwards,
  AdedonhaConfig,
  AdedonhaRoom,
  AdedonhaTallyVerdict,
} from '@/model/entities/multiplayerSession';

export interface IAdedonhaUseCases {
  getSuggestedColumns(): string[];
  getLocalPlayerId(roomId?: string): Promise<string | null>;
  getRoom(roomId?: string): Promise<AdedonhaRoom>;
  createRoom(
    hostNickname: string,
    initialColumns?: string[]
  ): Promise<AdedonhaRoom>;
  joinRoom(code: string, nickname: string): Promise<AdedonhaRoom>;
  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: AdedonhaRoom) => void
  ): () => void;
  addColumn(roomId: string, columnName: string): Promise<AdedonhaRoom>;
  removeColumn(roomId: string, columnName: string): Promise<AdedonhaRoom>;
  updateConfig(
    roomId: string,
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ): Promise<AdedonhaRoom>;
  getAvailableLetters(room: AdedonhaRoom): string[];
  spinRoulette(
    roomId: string,
    preferredLetter?: string
  ): Promise<AdedonhaRoom>;
  validateAnswerInitial(
    answer: string,
    roundLetter: string | null
  ): string | null;
  canTriggerStop(
    columns: string[],
    answers: Record<string, string>,
    roundLetter: string | null
  ): boolean;
  triggerAdedonha(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom>;
  submitAnswers(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom>;
  startStopCountdown(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom>;
  finalizeStopCountdown(roomId: string): Promise<AdedonhaRoom>;
  finishRoundByTimeOut(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom>;
  raiseDoubt(roomId: string, submissionId: string): Promise<AdedonhaRoom>;
  judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict
  ): Promise<AdedonhaRoom>;
  advanceTallyColumn(roomId: string): Promise<AdedonhaRoom>;
  advanceToNextRound(roomId: string): Promise<AdedonhaRoom>;
  getAwards(room: AdedonhaRoom): AdedonhaAwards;
}
