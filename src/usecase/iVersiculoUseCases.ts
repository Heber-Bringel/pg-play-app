import type { Team } from '@/model/entities/team';
import type {
  VerseBlankResult,
  VerseHint,
  VerseMatchConfig,
  VersePassage,
} from '@/model/entities/versePassage';

export type PreparedVerseMatch = {
  teams: Team[];
  passages: VersePassage[];
  config: VerseMatchConfig;
};

export interface IVersiculoUseCases {
  listTeams(): Promise<Team[]>;
  prepareMatch(config: VerseMatchConfig): Promise<PreparedVerseMatch>;
  buildHints(passage: VersePassage): VerseHint[];
  evaluateAnswers(
    passage: VersePassage,
    answersByIndex: Record<number, string>,
    usedHint: boolean
  ): VerseBlankResult[];
  acceptBlankByLeader(
    results: VerseBlankResult[],
    blankIndex: number,
    usedHint: boolean
  ): VerseBlankResult[];
  recordTeamScore(teamId: string, points: number): Promise<void>;
}
