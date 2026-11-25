import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type { IMatchSettingsDataSource } from '@/model/datasources/iMatchSettingsDataSource';
import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
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
import {
  DEFAULT_MATCH_SETTINGS,
  QUIZ_QUESTION_COUNT_OPTIONS,
  type DesenhoDurationOption,
  type DesenhoSettings,
  type ForcaAttemptsOption,
  type ForcaSettings,
  type MatchSettings,
  type MimicaDurationOption,
  type MimicaSettings,
  type QuizDurationOption,
  type QuizQuestionCountOption,
  type QuizMatchPlan,
  type QuizSettings,
} from '@/model/entities/matchSettings';
import type { GameModalityFilter, Minigame } from '@/model/entities/minigame';
import type { Team } from '@/model/entities/team';
import { ValidationError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

const VALID_MODALITIES: ReadonlySet<GameModalityFilter> = new Set([
  'Todos',
  '1 Celular',
  'Multi-Celular',
]);

const VALID_CONTENT_PACK_GAMES: ReadonlySet<ContentPackGameId> = new Set([
  'mimica',
  'quiz',
  'forca',
  'desenho',
]);

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export const DEFAULT_MIMICA_HIT_POINTS = 20;
export const DEFAULT_MIMICA_SKIP_PENALTY = 5;
export const DEFAULT_DESENHO_HIT_POINTS = 20;
export const DEFAULT_DESENHO_SKIP_PENALTY = 5;
export const DEFAULT_FORCA_WIN_POINTS = 30;
export const DEFAULT_FORCA_ATTEMPT_BONUS = 2;
export const DEFAULT_QUIZ_CORRECT_POINTS = 10;

const VALID_MIMICA_DURATIONS: ReadonlySet<number> = new Set<MimicaDurationOption>([45, 60, 90]);
const VALID_QUIZ_DURATIONS: ReadonlySet<number> = new Set<QuizDurationOption>([15, 20, 30]);
const VALID_QUIZ_QUESTION_COUNTS: ReadonlySet<number> = new Set<QuizQuestionCountOption>(
  QUIZ_QUESTION_COUNT_OPTIONS
);
const VALID_FORCA_ATTEMPTS: ReadonlySet<number> = new Set<ForcaAttemptsOption>([5, 6, 8]);
const VALID_DESENHO_DURATIONS: ReadonlySet<number> = new Set<DesenhoDurationOption>([60, 90, 120]);
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 5;

const isMimicaDuration = (value: unknown): value is MimicaDurationOption =>
  typeof value === 'number' && VALID_MIMICA_DURATIONS.has(value);
const isQuizDuration = (value: unknown): value is QuizDurationOption =>
  typeof value === 'number' && VALID_QUIZ_DURATIONS.has(value);
const isQuizQuestionCount = (value: unknown): value is QuizQuestionCountOption =>
  typeof value === 'number' && VALID_QUIZ_QUESTION_COUNTS.has(value);
const isForcaAttempts = (value: unknown): value is ForcaAttemptsOption =>
  typeof value === 'number' && VALID_FORCA_ATTEMPTS.has(value);
const isDesenhoDuration = (value: unknown): value is DesenhoDurationOption =>
  typeof value === 'number' && VALID_DESENHO_DURATIONS.has(value);
const isValidRounds = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_ROUNDS &&
  value <= MAX_ROUNDS;

// Valores corrompidos ou de versões antigas no armazenamento voltam ao padrão.
function sanitizeMatchSettings(raw: MatchSettings): MatchSettings {
  const defaults = DEFAULT_MATCH_SETTINGS;
  return {
    mimica: {
      durationSeconds: isMimicaDuration(raw.mimica?.durationSeconds)
        ? raw.mimica.durationSeconds
        : defaults.mimica.durationSeconds,
      totalRounds: isValidRounds(raw.mimica?.totalRounds)
        ? raw.mimica.totalRounds
        : defaults.mimica.totalRounds,
    },
    quiz: {
      durationSeconds: isQuizDuration(raw.quiz?.durationSeconds)
        ? raw.quiz.durationSeconds
        : defaults.quiz.durationSeconds,
      questionCount: isQuizQuestionCount(raw.quiz?.questionCount)
        ? raw.quiz.questionCount
        : defaults.quiz.questionCount,
    },
    forca: {
      maxAttempts: isForcaAttempts(raw.forca?.maxAttempts)
        ? raw.forca.maxAttempts
        : defaults.forca.maxAttempts,
      totalRounds: isValidRounds(raw.forca?.totalRounds)
        ? raw.forca.totalRounds
        : defaults.forca.totalRounds,
    },
    desenho: {
      durationSeconds: isDesenhoDuration(raw.desenho?.durationSeconds)
        ? raw.desenho.durationSeconds
        : defaults.desenho.durationSeconds,
      totalRounds: isValidRounds(raw.desenho?.totalRounds)
        ? raw.desenho.totalRounds
        : defaults.desenho.totalRounds,
    },
  };
}

export class PgPlayUseCases implements IPgPlayUseCases {
  // Fila que serializa as gravações de parâmetros: dois toques seguidos
  // não podem ler o mesmo estado antigo e sobrescrever um ao outro.
  private settingsQueue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly teamDataSource: ITeamDataSource,
    private readonly gameCatalogDataSource: IGameCatalogDataSource,
    private readonly matchSettingsDataSource: IMatchSettingsDataSource
  ) {}

  async listMinigames(
    query: string = '',
    modality: GameModalityFilter = 'Todos'
  ): Promise<Minigame[]> {
    if (!VALID_MODALITIES.has(modality)) {
      throw new ValidationError('Modalidade de filtro inválida para o catálogo de jogos.');
    }

    const normalizedQuery = normalizeSearchText(query);
    const games = await this.gameCatalogDataSource.listMinigames();

    return games.filter((game) => {
      const matchesModality = modality === 'Todos' || game.modality === modality;
      if (!matchesModality) return false;
      if (!normalizedQuery) return true;

      const searchableFields = [
        game.title,
        game.description,
        game.playersTag,
        ...game.themes,
      ];
      return searchableFields.some((field) =>
        normalizeSearchText(field).includes(normalizedQuery)
      );
    });
  }

  async listContentPacks(gameId?: ContentPackGameId): Promise<ContentPack[]> {
    if (gameId !== undefined && !VALID_CONTENT_PACK_GAMES.has(gameId)) {
      throw new ValidationError('Jogo inválido para listagem de pacotes de conteúdo.');
    }
    return this.gameCatalogDataSource.listContentPacks(gameId);
  }

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

  async listDesenhoCards(categories?: DesenhoCategory[]): Promise<DesenhoCard[]> {
    if (categories !== undefined && categories.length === 0) {
      throw new ValidationError(
        'Selecione pelo menos um pacote de categoria para o Desenho Relâmpago.'
      );
    }
    return this.gameCatalogDataSource.listDesenhoCards(categories);
  }

  async scoreDesenhoHit(
    teamId: string,
    points: number = DEFAULT_DESENHO_HIT_POINTS
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

  async scoreDesenhoSkip(
    teamId: string,
    penalty: number = DEFAULT_DESENHO_SKIP_PENALTY
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

  async getScoreboard(): Promise<Team[]> {
    const teams = await this.teamDataSource.listTeams();
    return [...teams].sort((a, b) => b.score - a.score);
  }

  async resetScoreboard(): Promise<Team[]> {
    await this.teamDataSource.resetScores();
    return this.getScoreboard();
  }

  async getMatchSettings(): Promise<MatchSettings> {
    const stored = await this.matchSettingsDataSource.getSettings();
    return sanitizeMatchSettings(stored);
  }

  updateMimicaSettings(changes: Partial<MimicaSettings>): Promise<MatchSettings> {
    return this.saveSettingsSection((current) => {
      const mimica: MimicaSettings = { ...current.mimica, ...changes };
      if (!isMimicaDuration(mimica.durationSeconds)) {
        throw new ValidationError('Duração da Mímica deve ser 45s, 60s ou 90s.');
      }
      if (!isValidRounds(mimica.totalRounds)) {
        throw new ValidationError('A quantidade de rodadas da Mímica deve estar entre 1 e 5.');
      }
      return { ...current, mimica };
    });
  }

  updateQuizSettings(changes: Partial<QuizSettings>): Promise<MatchSettings> {
    return this.saveSettingsSection((current) => {
      const quiz: QuizSettings = { ...current.quiz, ...changes };
      if (!isQuizDuration(quiz.durationSeconds)) {
        throw new ValidationError('Tempo por pergunta do Quiz deve ser 15s, 20s ou 30s.');
      }
      if (!isQuizQuestionCount(quiz.questionCount)) {
        throw new ValidationError('A quantidade de perguntas do Quiz deve ser 5, 10 ou 15.');
      }
      return { ...current, quiz };
    });
  }

  updateForcaSettings(changes: Partial<ForcaSettings>): Promise<MatchSettings> {
    return this.saveSettingsSection((current) => {
      const forca: ForcaSettings = { ...current.forca, ...changes };
      if (!isForcaAttempts(forca.maxAttempts)) {
        throw new ValidationError('Quantidade de tentativas da Forca deve ser 5, 6 ou 8.');
      }
      if (!isValidRounds(forca.totalRounds)) {
        throw new ValidationError('A quantidade de palavras da Forca deve estar entre 1 e 5.');
      }
      return { ...current, forca };
    });
  }

  updateDesenhoSettings(changes: Partial<DesenhoSettings>): Promise<MatchSettings> {
    return this.saveSettingsSection((current) => {
      const desenho: DesenhoSettings = { ...current.desenho, ...changes };
      if (!isDesenhoDuration(desenho.durationSeconds)) {
        throw new ValidationError('Duração do Desenho Relâmpago deve ser 60s, 90s ou 120s.');
      }
      if (!isValidRounds(desenho.totalRounds)) {
        throw new ValidationError(
          'A quantidade de rodadas do Desenho Relâmpago deve estar entre 1 e 5.'
        );
      }
      return { ...current, desenho };
    });
  }

  planQuizMatch(
    configuredCount: number,
    availableQuestions: number,
    teamCount: number
  ): QuizMatchPlan {
    const playable = Math.max(0, Math.min(configuredCount, availableQuestions));
    if (teamCount < 2 || playable < teamCount) {
      return {
        totalQuestions: playable,
        questionsPerTeam: teamCount > 0 ? Math.floor(playable / teamCount) : 0,
        limitedByBank: availableQuestions < configuredCount,
      };
    }
    // Arredonda para baixo até um múltiplo do número de equipes, para que
    // todas respondam a mesma quantidade de perguntas (alternância justa).
    const questionsPerTeam = Math.floor(playable / teamCount);
    return {
      totalQuestions: questionsPerTeam * teamCount,
      questionsPerTeam,
      limitedByBank: availableQuestions < configuredCount,
    };
  }

  // Só oferece quantidades que o pacote atual consegue cumprir. A menor opção
  // fica sempre disponível para a partida poder começar com pacotes pequenos.
  listAvailableQuizQuestionCounts(availableQuestions: number): QuizQuestionCountOption[] {
    const fitting = QUIZ_QUESTION_COUNT_OPTIONS.filter((count) => count <= availableQuestions);
    return fitting.length > 0 ? fitting : [QUIZ_QUESTION_COUNT_OPTIONS[0]];
  }

  private saveSettingsSection(
    buildNext: (current: MatchSettings) => MatchSettings
  ): Promise<MatchSettings> {
    const task = this.settingsQueue.then(async () => {
      const current = await this.getMatchSettings();
      const next = buildNext(current);
      await this.matchSettingsDataSource.saveSettings(next);
      return next;
    });
    this.settingsQueue = task.catch(() => undefined);
    return task;
  }
}
