import type {
  AdedonhaConfig,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
} from '@/model/entities/multiplayerSession';

export interface IMultiplayerRoomService {
  getAdedonhaRoom(roomId?: string): Promise<AdedonhaRoom>;
  createAdedonhaRoom(
    hostNickname: string,
    initialColumns?: string[]
  ): Promise<AdedonhaRoom>;
  joinAdedonhaRoom(code: string, nickname: string): Promise<AdedonhaRoom>;
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
}
