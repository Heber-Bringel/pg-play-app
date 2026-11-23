import type {
  QuemSouEuCard,
  QuemSouEuCardResult,
  QuemSouEuMatchConfig,
  QuemSouEuTurnOutcome,
  TiltGesture,
} from '@/model/entities/quemSouEuCard';
import type { Team } from '@/model/entities/team';

export type PreparedQuemSouEuMatch = {
  teams: Team[];
  cards: QuemSouEuCard[];
  config: QuemSouEuMatchConfig;
};

export interface IQuemSouEuUseCases {
  listTeams(): Promise<Team[]>;
  isTiltSensorAvailable(): Promise<boolean>;
  prepareMatch(config: QuemSouEuMatchConfig): Promise<PreparedQuemSouEuMatch>;
  subscribeTiltSensor(
    onGesture: (gesture: TiltGesture) => void,
    cooldownMs?: number
  ): () => void;
  recordCardOutcome(
    card: QuemSouEuCard,
    outcome: QuemSouEuTurnOutcome
  ): QuemSouEuCardResult;
  recordTeamScore(teamId: string, points: number): Promise<void>;
  lockLandscape(): Promise<void>;
  unlockOrientation(): Promise<void>;
}
