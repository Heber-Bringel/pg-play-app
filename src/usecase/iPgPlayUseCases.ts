import type { MimicaCard, MimicaCategory } from '@/model/entities/arenaChallenge';
import type { Team } from '@/model/entities/team';

export interface IPgPlayUseCases {
  listTeams(): Promise<Team[]>;
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
  scoreMimicaHit(teamId: string, points?: number): Promise<Team[]>;
  scoreMimicaSkip(teamId: string, penalty?: number): Promise<Team[]>;
}
