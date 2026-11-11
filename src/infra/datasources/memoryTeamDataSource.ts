import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
import type { Team } from '@/model/entities/team';
import { DataSourceError } from '@/model/errors';

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Tribo de Judá', score: 0 },
  { id: 'team-2', name: 'Leões da Fé', score: 0 },
];

export class MemoryTeamDataSource implements ITeamDataSource {
  private teams: Team[];

  constructor(initialTeams: Team[] = DEFAULT_TEAMS) {
    this.teams = initialTeams.map((team) => ({ ...team }));
  }

  async listTeams(): Promise<Team[]> {
    try {
      return this.teams.map((team) => ({ ...team }));
    } catch {
      throw new DataSourceError('Não foi possível listar as equipes.');
    }
  }

  async addTeam(name: string): Promise<Team> {
    try {
      const created: Team = {
        id: `team-${Date.now()}-${this.teams.length + 1}`,
        name: name.trim(),
        score: 0,
      };
      this.teams.push(created);
      return { ...created };
    } catch {
      throw new DataSourceError('Não foi possível salvar a equipe.');
    }
  }

  async removeTeam(id: string): Promise<void> {
    try {
      this.teams = this.teams.filter((team) => team.id !== id);
    } catch {
      throw new DataSourceError('Não foi possível remover a equipe.');
    }
  }

  async addScore(teamId: string, points: number): Promise<void> {
    try {
      this.teams = this.teams.map((team) =>
        team.id === teamId
          ? { ...team, score: Math.max(0, team.score + points) }
          : team
      );
    } catch {
      throw new DataSourceError('Não foi possível atualizar a pontuação da equipe.');
    }
  }

  async resetScores(): Promise<void> {
    try {
      this.teams = this.teams.map((team) => ({ ...team, score: 0 }));
    } catch {
      throw new DataSourceError('Não foi possível reiniciar o placar.');
    }
  }
}
