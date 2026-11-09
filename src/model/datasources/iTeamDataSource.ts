import type { Team } from '@/model/entities/team';

export interface ITeamDataSource {
  listTeams(): Promise<Team[]>;
  addTeam(name: string): Promise<Team>;
  removeTeam(id: string): Promise<void>;
  addScore(teamId: string, points: number): Promise<void>;
  resetScores(): Promise<void>;
}
