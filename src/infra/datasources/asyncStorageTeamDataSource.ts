import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
import type { Team } from '@/model/entities/team';
import { DataSourceError } from '@/model/errors';

const TEAMS_STORAGE_KEY = '@pgplay:teams:v1';

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Tribo de Judá', score: 0 },
  { id: 'team-2', name: 'Leões da Fé', score: 0 },
];

export class AsyncStorageTeamDataSource implements ITeamDataSource {
  async listTeams(): Promise<Team[]> {
    try {
      const raw = await AsyncStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) {
        await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(DEFAULT_TEAMS));
        return [...DEFAULT_TEAMS];
      }
      return JSON.parse(raw) as Team[];
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error ? err.message : 'Não foi possível carregar as equipes do armazenamento.'
      );
    }
  }

  async addTeam(name: string): Promise<Team> {
    try {
      const teams = await this.listTeams();
      const created: Team = {
        id: `team-${Date.now()}-${teams.length + 1}`,
        name: name.trim(),
        score: 0,
      };
      const updated = [...teams, created];
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
      return created;
    } catch (err: unknown) {
      if (err instanceof DataSourceError) throw err;
      throw new DataSourceError(
        err instanceof Error ? err.message : 'Não foi possível salvar a equipe no armazenamento.'
      );
    }
  }

  async removeTeam(id: string): Promise<void> {
    try {
      const teams = await this.listTeams();
      const updated = teams.filter((t) => t.id !== id);
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: unknown) {
      if (err instanceof DataSourceError) throw err;
      throw new DataSourceError(
        err instanceof Error ? err.message : 'Não foi possível remover a equipe do armazenamento.'
      );
    }
  }

  async addScore(teamId: string, points: number): Promise<void> {
    try {
      const teams = await this.listTeams();
      const updated = teams.map((team) =>
        team.id === teamId
          ? { ...team, score: Math.max(0, team.score + points) }
          : team
      );
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: unknown) {
      if (err instanceof DataSourceError) throw err;
      throw new DataSourceError(
        err instanceof Error ? err.message : 'Não foi possível atualizar a pontuação no armazenamento.'
      );
    }
  }

  async resetScores(): Promise<void> {
    try {
      const teams = await this.listTeams();
      const updated = teams.map((team) => ({ ...team, score: 0 }));
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: unknown) {
      if (err instanceof DataSourceError) throw err;
      throw new DataSourceError(
        err instanceof Error ? err.message : 'Não foi possível zerar o placar no armazenamento.'
      );
    }
  }
}
