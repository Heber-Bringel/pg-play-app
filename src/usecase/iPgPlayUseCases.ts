import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';
import type {
  ForcaSettings,
  MatchSettings,
  MimicaSettings,
  QuizMatchPlan,
  QuizSettings,
} from '@/model/entities/matchSettings';
import type { GameModalityFilter, Minigame } from '@/model/entities/minigame';
import type { Team } from '@/model/entities/team';

export interface IPgPlayUseCases {
  listMinigames(query?: string, modality?: GameModalityFilter): Promise<Minigame[]>;
  listTeams(): Promise<Team[]>;
  addTeam(name: string): Promise<Team>;
  removeTeam(teamId: string): Promise<Team[]>;
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
  scoreMimicaHit(teamId: string, points?: number): Promise<Team[]>;
  scoreMimicaSkip(teamId: string, penalty?: number): Promise<Team[]>;
  listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>;
  scoreForcaWord(teamId: string, remainingAttempts?: number): Promise<Team[]>;
  listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]>;
  scoreQuizAnswer(teamId: string, isCorrect: boolean, points?: number): Promise<Team[]>;
  getScoreboard(): Promise<Team[]>;
  awardBonusPoints(teamId: string, bonusPoints?: number): Promise<Team[]>;
  resetScoreboard(): Promise<Team[]>;
  getMatchSettings(): Promise<MatchSettings>;
  updateMimicaSettings(changes: Partial<MimicaSettings>): Promise<MatchSettings>;
  updateQuizSettings(changes: Partial<QuizSettings>): Promise<MatchSettings>;
  updateForcaSettings(changes: Partial<ForcaSettings>): Promise<MatchSettings>;
  planQuizMatch(
    configuredCount: number,
    availableQuestions: number,
    teamCount: number
  ): QuizMatchPlan;
}
