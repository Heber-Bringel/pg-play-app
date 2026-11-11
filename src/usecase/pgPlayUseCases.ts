import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';
import type { Team } from '@/model/entities/team';
import { ValidationError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export const DEFAULT_MIMICA_HIT_POINTS = 20;
export const DEFAULT_MIMICA_SKIP_PENALTY = 5;
export const DEFAULT_SCOREBOARD_BONUS_POINTS = 10;
export const DEFAULT_FORCA_WIN_POINTS = 30;
export const DEFAULT_FORCA_ATTEMPT_BONUS = 2;
export const DEFAULT_QUIZ_CORRECT_POINTS = 10;

export class PgPlayUseCases implements IPgPlayUseCases {
  constructor(
    private readonly teamDataSource: ITeamDataSource,
    private readonly gameCatalogDataSource: IGameCatalogDataSource
  ) {}

  async listTeams(): Promise<Team[]> {
    return this.teamDataSource.listTeams();
  }

  async addTeam(name: string): Promise<Team> {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      throw new ValidationError('Digite um nome com pelo menos 2 letras para a equipe.');
    }
    if (cleanName.length > 20) {
      throw new ValidationError('O nome da equipe deve ter no máximo 20 caracteres.');
    }

    const currentTeams = await this.teamDataSource.listTeams();
    if (currentTeams.length >= 6) {
      throw new ValidationError('Limite máximo de 6 equipes atingido para a sessão.');
    }

    const duplicate = currentTeams.some(
      (team) => team.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      throw new ValidationError('Já existe uma equipe cadastrada com este nome.');
    }

    return this.teamDataSource.addTeam(cleanName);
  }

  async removeTeam(teamId: string): Promise<Team[]> {
    const cleanTeamId = teamId.trim();
    if (!cleanTeamId) {
      throw new ValidationError('Identificador da equipe é obrigatório para remoção.');
    }

    const currentTeams = await this.teamDataSource.listTeams();
    const target = currentTeams.find((team) => team.id === cleanTeamId);
    if (!target) {
      throw new ValidationError('Equipe não encontrada para remoção.');
    }

    await this.teamDataSource.removeTeam(cleanTeamId);
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

  async listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]> {
    if (categories !== undefined && categories.length === 0) {
      throw new ValidationError('Selecione pelo menos um pacote de categoria para o Quiz.');
    }
    return this.gameCatalogDataSource.listQuizQuestions(categories);
  }

  async scoreQuizAnswer(
    teamId: string,
    isCorrect: boolean,
    points: number = DEFAULT_QUIZ_CORRECT_POINTS
  ): Promise<Team[]> {
    const cleanTeamId = teamId.trim();
    if (!cleanTeamId) {
      throw new ValidationError('Identificador da equipe é obrigatório para pontuar.');
    }
    if (points <= 0) {
      throw new ValidationError('A pontuação por acerto deve ser maior que zero.');
    }

    const currentTeams = await this.teamDataSource.listTeams();
    const target = currentTeams.find((team) => team.id === cleanTeamId);
    if (!target) {
      throw new ValidationError('Equipe não encontrada para pontuação no Quiz.');
    }

    if (isCorrect) {
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
