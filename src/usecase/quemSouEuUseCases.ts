import type { IQuemSouEuDataSource } from '@/model/datasources/iQuemSouEuDataSource';
import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
import type {
  QuemSouEuCard,
  QuemSouEuCardResult,
  QuemSouEuDurationOption,
  QuemSouEuMatchConfig,
  QuemSouEuTurnOutcome,
  TiltGesture,
} from '@/model/entities/quemSouEuCard';
import type { Team } from '@/model/entities/team';
import { ValidationError } from '@/model/errors';
import type { IHapticService } from '@/model/services/iHapticService';
import type { IScreenOrientationService } from '@/model/services/iScreenOrientationService';
import type { ITiltSensorService } from '@/model/services/iTiltSensorService';
import type {
  IQuemSouEuUseCases,
  PreparedQuemSouEuMatch,
} from '@/usecase/iQuemSouEuUseCases';

const MIN_TEAMS = 2;
const MIN_ROUNDS_PER_TEAM = 1;
const MAX_ROUNDS_PER_TEAM = 5;
const ALLOWED_DURATIONS: readonly QuemSouEuDurationOption[] = [45, 60, 90];
const HIT_POINTS = 10;
const PASS_POINTS = 0;
const DEFAULT_TILT_COOLDOWN_MS = 1000;

function shuffleCards(cards: QuemSouEuCard[]): QuemSouEuCard[] {
  const copy = cards.map((card) => ({ ...card }));
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

export class QuemSouEuUseCases implements IQuemSouEuUseCases {
  private readonly cardDataSource: IQuemSouEuDataSource;
  private readonly teamDataSource: ITeamDataSource;
  private readonly tiltSensorService: ITiltSensorService;
  private readonly screenOrientationService?: IScreenOrientationService;
  private readonly hapticService?: IHapticService;

  constructor(
    cardDataSource: IQuemSouEuDataSource,
    teamDataSource: ITeamDataSource,
    tiltSensorService: ITiltSensorService,
    screenOrientationService?: IScreenOrientationService,
    hapticService?: IHapticService
  ) {
    this.cardDataSource = cardDataSource;
    this.teamDataSource = teamDataSource;
    this.tiltSensorService = tiltSensorService;
    this.screenOrientationService = screenOrientationService;
    this.hapticService = hapticService;
  }

  async listTeams(): Promise<Team[]> {
    return this.teamDataSource.listTeams();
  }

  async isTiltSensorAvailable(): Promise<boolean> {
    return this.tiltSensorService.isAvailable();
  }

  async prepareMatch(
    config: QuemSouEuMatchConfig
  ): Promise<PreparedQuemSouEuMatch> {
    const teams = await this.teamDataSource.listTeams();
    if (teams.length < MIN_TEAMS) {
      throw new ValidationError(
        'Cadastre pelo menos 2 equipes antes de iniciar Quem Sou Eu?.'
      );
    }

    if (!config.packs || config.packs.length === 0) {
      throw new ValidationError(
        'Selecione pelo menos 1 pacote de temas para iniciar a partida.'
      );
    }

    if (!ALLOWED_DURATIONS.includes(config.durationSeconds)) {
      throw new ValidationError(
        'Escolha um tempo por turno válido: 45s, 60s ou 90s.'
      );
    }

    if (
      !Number.isInteger(config.roundsPerTeam) ||
      config.roundsPerTeam < MIN_ROUNDS_PER_TEAM ||
      config.roundsPerTeam > MAX_ROUNDS_PER_TEAM
    ) {
      throw new ValidationError('Escolha entre 1 e 5 rodadas por equipe.');
    }

    if (config.tiltEnabled && !(await this.tiltSensorService.isAvailable())) {
      throw new ValidationError(
        'Sensor de inclinação indisponível neste aparelho. Escolha o modo Botões.'
      );
    }

    const availableCards = await this.cardDataSource.listCards(config.packs);
    if (availableCards.length === 0) {
      throw new ValidationError(
        'Não há cartas disponíveis para os pacotes selecionados.'
      );
    }

    return {
      teams,
      cards: shuffleCards(availableCards),
      config: {
        ...config,
        packs: [...config.packs],
      },
    };
  }

  subscribeTiltSensor(
    onGesture: (gesture: TiltGesture) => void,
    cooldownMs: number = DEFAULT_TILT_COOLDOWN_MS
  ): () => void {
    const safeCooldown =
      cooldownMs >= DEFAULT_TILT_COOLDOWN_MS
        ? cooldownMs
        : DEFAULT_TILT_COOLDOWN_MS;
    return this.tiltSensorService.subscribe(onGesture, safeCooldown);
  }

  recordCardOutcome(
    card: QuemSouEuCard,
    outcome: QuemSouEuTurnOutcome
  ): QuemSouEuCardResult {
    if (this.hapticService) {
      if (outcome === 'hit') {
        void this.hapticService.triggerHit();
      } else {
        void this.hapticService.triggerPass();
      }
    }

    return {
      card: { ...card },
      outcome,
      pointsAwarded: outcome === 'hit' ? HIT_POINTS : PASS_POINTS,
    };
  }

  async recordTeamScore(teamId: string, points: number): Promise<void> {
    const normalizedId = teamId.trim();
    if (!normalizedId) {
      throw new ValidationError('Equipe inválida para registrar pontuação.');
    }

    if (points < 0) {
      throw new ValidationError(
        'A pontuação do Quem Sou Eu? não pode ser negativa.'
      );
    }

    if (points === 0) {
      return;
    }

    await this.teamDataSource.addScore(normalizedId, points);
  }

  async lockLandscape(): Promise<void> {
    if (!this.screenOrientationService) {
      return;
    }
    await this.screenOrientationService.lockLandscape();
  }

  async unlockOrientation(): Promise<void> {
    if (!this.screenOrientationService) {
      return;
    }
    await this.screenOrientationService.unlock();
  }
}
