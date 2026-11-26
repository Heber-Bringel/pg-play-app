import type {
  DesenhoCategory,
  DrawingElementDraft,
} from '@/model/entities/drawingChallenge';
import type {
  DesenhoAwards,
  DesenhoConfig,
  DesenhoPlayer,
  DesenhoRoom,
} from '@/model/entities/multiplayerSession';
import type { SubmitDesenhoGuessResult } from '@/model/services/iMultiplayerRoomService';

export interface IDesenhoUseCases {
  getLocalPlayerId(roomId?: string): Promise<string | null>;
  getRoom(roomId?: string, viewerPlayerId?: string): Promise<DesenhoRoom>;
  createRoom(
    hostNickname: string,
    initialCategories?: DesenhoCategory[]
  ): Promise<DesenhoRoom>;
  joinRoom(code: string, nickname: string): Promise<DesenhoRoom>;
  leaveRoom(roomId: string, playerId: string): Promise<void>;
  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: DesenhoRoom) => void
  ): () => void;
  updateConfig(
    roomId: string,
    partialConfig: Partial<DesenhoConfig>
  ): Promise<DesenhoRoom>;
  startMatch(roomId: string): Promise<DesenhoRoom>;
  addElement(
    roomId: string,
    drawerId: string,
    draft: DrawingElementDraft
  ): Promise<DesenhoRoom>;
  undoElement(roomId: string, drawerId: string): Promise<DesenhoRoom>;
  clearCanvas(roomId: string, drawerId: string): Promise<DesenhoRoom>;
  submitGuess(
    roomId: string,
    playerId: string,
    text: string
  ): Promise<SubmitDesenhoGuessResult>;
  finishTurn(
    roomId: string,
    reason?: 'timeout' | 'all_guessed' | 'drawer_left'
  ): Promise<DesenhoRoom>;
  advanceTurn(roomId: string): Promise<DesenhoRoom>;
  restartLobby(roomId: string): Promise<DesenhoRoom>;
  getRankedPlayers(room: DesenhoRoom): DesenhoPlayer[];
  getAwards(room: DesenhoRoom): DesenhoAwards;
}
