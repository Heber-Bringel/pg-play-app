import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
} from '@/model/entities/arenaChallenge';
import type { Team } from '@/model/entities/team';
import { ValidationError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export const DEFAULT_MIMICA_HIT_POINTS = 20;
export const DEFAULT_MIMICA_SKIP_PENALTY = 5;
export const DEFAULT_SCOREBOARD_BONUS_POINTS = 10;
export const DEFAULT_FORCA_WIN_POINTS = 30;
export const DEFAULT_FORCA_ATTEMPT_BONUS = 2;

export class PgPlayUseCases implements IPgPlayUseCases {
  constructor(
    private readonly teamDataSource: ITeamDataSource,
    private readonly gameCatalogDataSource: IGameCatalogDataSource
  ) {}

  async listTeams(): Promise<Team[]> {
    return this.teamDataSource.listTeams();
  }

  async listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]> {
    if (categories !== undefined && categories.length === 0) {
      throw new ValidationError('Selecione pelo menos um pacote de categoria para a Mímica.');
    }
    return this.gameCatalogDataSource.listMimicaCards(categories);
  }

  async scoreMimicaHit(
    teamId: string,
    points: number = DEFAULT_MIMICA_HIT_POINTS
  ): Promise<Team[]> {
    const cleanTeamId = teamId.trim();
    if (!cleanTeamId) {
      throw new ValidationError('Identificador da equipe é obrigatório para pontuar.');
    }
    if (points <= 0) {
      throw new ValidationError('A pontuação por acerto deve ser maior que zero.');
    }

    const teams = await this.teamDataSource.listTeams();
    const target = teams.find((team) => team.id === cleanTeamId);
    if (!target) {
      throw new ValidationError('Equipe não encontrada na sessão atual.');
    }

    await this.teamDataSource.addScore(cleanTeamId, points);
    return this.teamDataSource.listTeams();
  }

  async scoreMimicaSkip(
    teamId: string,
    penalty: number = DEFAULT_MIMICA_SKIP_PENALTY
  ): Promise<Team[]> {
    const cleanTeamId = teamId.trim();
    if (!cleanTeamId) {
      throw new ValidationError('Identificador da equipe é obrigatório para registrar o pulo.');
    }
    if (penalty < 0) {
      throw new ValidationError('A penalidade por pulo não pode ser negativa.');
    }

    const teams = await this.teamDataSource.listTeams();
    const target = teams.find((team) => team.id === cleanTeamId);
    if (!target) {
      throw new ValidationError('Equipe não encontrada na sessão atual.');
    }

    const deduction = -Math.min(target.score, penalty);
    if (deduction !== 0) {
      await this.teamDataSource.addScore(cleanTeamId, deduction);
    }
    return this.teamDataSource.listTeams();
  }

  async listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]> {
    if (categories !== undefined && categories.length === 0) {
      throw new ValidationError('Selecione pelo menos um pacote de categoria para o Jogo da Forca.');
    }
    return this.gameCatalogDataSource.listForcaPuzzles(categories);
  }

  async scoreForcaWord(
    teamId: string,
    remainingAttempts: number = 0
  ): Promise<Team[]> {
    const cleanTeamId = teamId.trim();
    if (!cleanTeamId) {
      throw new ValidationError('Identificador da equipe é obrigatório para pontuar.');
    }
    if (remainingAttempts < 0) {
      throw new ValidationError('O número de tentativas restantes não pode ser negativo.');
    }

    const teams = await this.teamDataSource.listTeams();
    const target = teams.find((team) => team.id === cleanTeamId);
    if (!target) {
      throw new ValidationError('Equipe não encontrada na sessão atual.');
    }

    const points =
      remainingAttempts > 0
        ? DEFAULT_FORCA_WIN_POINTS + remainingAttempts * DEFAULT_FORCA_ATTEMPT_BONUS
        : 0;

    if (points > 0) {
      await this.teamDataSource.addScore(cleanTeamId, points);
    }
    return this.teamDataSource.listTeams();
  }

  async getScoreboard(): Promise<Team[]> {
    const teams = await this.teamDataSource.listTeams();
    return [...teams].sort((a, b) => b.score - a.score);
  }

  async awardBonusPoints(
    teamId: string,
    bonusPoints: number = DEFAULT_SCOREBOARD_BONUS_POINTS
  ): Promise<Team[]> {
    const cleanTeamId = teamId.trim();
    if (!cleanTeamId) {
      throw new ValidationError('Identificador da equipe é obrigatório para conceder bônus.');
    }
    if (bonusPoints <= 0) {
      throw new ValidationError('A pontuação de bônus deve ser maior que zero.');
    }

    const teams = await this.teamDataSource.listTeams();
    const target = teams.find((team) => team.id === cleanTeamId);
    if (!target) {
      throw new ValidationError('Equipe não encontrada na sessão atual.');
    }

    await this.teamDataSource.addScore(cleanTeamId, bonusPoints);
    return this.getScoreboard();
  }

  async resetScoreboard(): Promise<Team[]> {
    await this.teamDataSource.resetScores();
    return this.getScoreboard();
  }
}
