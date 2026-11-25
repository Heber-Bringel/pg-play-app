import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';
import type { ContentPack, ContentPackGameId } from '@/model/entities/contentPack';
import type { DesenhoCard, DesenhoCategory } from '@/model/entities/drawingChallenge';
import type {
  DesenhoSettings,
  ForcaSettings,
  MatchSettings,
  MimicaSettings,
  QuizMatchPlan,
  QuizQuestionCountOption,
  QuizSettings,
} from '@/model/entities/matchSettings';
import type { GameModalityFilter, Minigame } from '@/model/entities/minigame';
import type { Team } from '@/model/entities/team';

export interface IPgPlayUseCases {
  listMinigames(query?: string, modality?: GameModalityFilter): Promise<Minigame[]>;
  listContentPacks(gameId?: ContentPackGameId): Promise<ContentPack[]>;
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
  listDesenhoCards(categories?: DesenhoCategory[]): Promise<DesenhoCard[]>;
  scoreDesenhoHit(teamId: string, points?: number): Promise<Team[]>;
  scoreDesenhoSkip(teamId: string, penalty?: number): Promise<Team[]>;
  getScoreboard(): Promise<Team[]>;
  resetScoreboard(): Promise<Team[]>;
  getMatchSettings(): Promise<MatchSettings>;
  updateMimicaSettings(changes: Partial<MimicaSettings>): Promise<MatchSettings>;
  updateQuizSettings(changes: Partial<QuizSettings>): Promise<MatchSettings>;
  updateForcaSettings(changes: Partial<ForcaSettings>): Promise<MatchSettings>;
  updateDesenhoSettings(changes: Partial<DesenhoSettings>): Promise<MatchSettings>;
  planQuizMatch(
    configuredCount: number,
    availableQuestions: number,
    teamCount: number
  ): QuizMatchPlan;
  listAvailableQuizQuestionCounts(availableQuestions: number): QuizQuestionCountOption[];
}
