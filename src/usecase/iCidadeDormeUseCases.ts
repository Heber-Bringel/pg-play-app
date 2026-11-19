import type {
  CidadeDormeConfig,
  CidadeDormeRole,
  CidadeDormeRoom,
  CidadeDormeVoiceProfile,
} from '@/model/entities/multiplayerSession';

export type CidadeDormeRoleMetadata = {
  role: CidadeDormeRole;
  title: string;
  alignmentLabel: string;
  description: string;
  icon: string;
};

export interface ICidadeDormeUseCases {
  getLocalPlayerId(roomId?: string): Promise<string | null>;
  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: CidadeDormeRoom) => void
  ): () => void;
  getRoom(roomId?: string): Promise<CidadeDormeRoom>;
  createRoom(hostNickname: string): Promise<CidadeDormeRoom>;
  joinRoom(code: string, nickname: string): Promise<CidadeDormeRoom>;
  leaveRoom(roomId: string, playerId: string): Promise<void>;
  removePlayer(roomId: string, playerId: string): Promise<CidadeDormeRoom>;
  updateConfig(
    roomId: string,
    partialConfig: Partial<CidadeDormeConfig>
  ): Promise<CidadeDormeRoom>;
  getRoleMetadata(role: CidadeDormeRole): CidadeDormeRoleMetadata;
  startMatch(
    roomId: string,
    preferredRoles?: CidadeDormeRole[]
  ): Promise<CidadeDormeRoom>;
  confirmPlayerReady(
    roomId: string,
    playerId: string,
    markCompanionsReady?: boolean
  ): Promise<CidadeDormeRoom>;
  submitAssassinTarget(
    roomId: string,
    targetPlayerId: string
  ): Promise<CidadeDormeRoom>;
  submitAngelProtection(
    roomId: string,
    protectedPlayerId: string | null
  ): Promise<CidadeDormeRoom>;
  submitDetectiveInvestigation(
    roomId: string,
    suspectPlayerId: string | null
  ): Promise<CidadeDormeRoom>;
  advanceToDawn(roomId: string): Promise<CidadeDormeRoom>;
  autoAdvanceNightTurn(roomId: string): Promise<CidadeDormeRoom>;
  startVotingPhase(roomId: string): Promise<CidadeDormeRoom>;
  castVote(
    roomId: string,
    voterPlayerId: string,
    targetPlayerIdOrSkip: string
  ): Promise<CidadeDormeRoom>;
  tallyVotes(roomId: string): Promise<CidadeDormeRoom>;
  startNextNight(roomId: string): Promise<CidadeDormeRoom>;
  restartMatch(
    roomId: string,
    preferredRoles?: CidadeDormeRole[]
  ): Promise<CidadeDormeRoom>;
  speakNarratorCaption(
    caption: string,
    voice: CidadeDormeVoiceProfile
  ): Promise<void>;
  stopNarratorAudio(): Promise<void>;
}
