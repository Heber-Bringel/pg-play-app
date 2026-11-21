import type { ITeamDataSource } from '@/model/datasources/iTeamDataSource';
import type { IVerseDataSource } from '@/model/datasources/iVerseDataSource';
import type { Team } from '@/model/entities/team';
import type {
  VerseBlankResult,
  VerseDurationOption,
  VerseHint,
  VerseMatchConfig,
  VersePassage,
} from '@/model/entities/versePassage';
import { ValidationError } from '@/model/errors';
import type {
  IVersiculoUseCases,
  PreparedVerseMatch,
} from '@/usecase/iVersiculoUseCases';

const VALID_DURATIONS: VerseDurationOption[] = [30, 45, 60];

function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function shufflePassages(passages: VersePassage[]): VersePassage[] {
  const copy = [...passages];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    copy[i] = copy[j];
    copy[j] = current;
  }
  return copy;
}

export class VersiculoUseCases implements IVersiculoUseCases {
  private readonly usedPassageIds = new Set<string>();

  constructor(
    private readonly verseDataSource: IVerseDataSource,
    private readonly teamDataSource: ITeamDataSource
  ) {}

  async listTeams(): Promise<Team[]> {
    return this.teamDataSource.listTeams();
  }

  async prepareMatch(config: VerseMatchConfig): Promise<PreparedVerseMatch> {
    const teams = await this.teamDataSource.listTeams();
    if (teams.length < 2) {
      throw new ValidationError(
        'Cadastre pelo menos 2 equipes antes de iniciar Complete o Versículo.'
      );
    }

    if (!config.packs || config.packs.length === 0) {
      throw new ValidationError(
        'Selecione pelo menos 1 pacote de passagens bíblicas.'
      );
    }

    if (!VALID_DURATIONS.includes(config.durationSeconds)) {
      throw new ValidationError(
        'Escolha um tempo válido por passagem (30s, 45s ou 60s).'
      );
    }

    if (
      !Number.isInteger(config.passagesPerTeam) ||
      config.passagesPerTeam < 1 ||
      config.passagesPerTeam > 5
    ) {
      throw new ValidationError(
        'A quantidade de passagens por equipe deve estar entre 1 e 5.'
      );
    }

    const availablePassages = await this.verseDataSource.listPassages(
      config.packs
    );
    if (availablePassages.length === 0) {
      throw new ValidationError(
        'Nenhuma passagem bíblica encontrada para os pacotes selecionados.'
      );
    }

    const totalDesired = teams.length * config.passagesPerTeam;
    const unseenPassages = shufflePassages(
      availablePassages.filter((passage) => !this.usedPassageIds.has(passage.id))
    );

    let selectedPassages: VersePassage[];
    if (unseenPassages.length >= totalDesired) {
      selectedPassages = unseenPassages.slice(0, totalDesired);
    } else {
      const unseenIds = new Set(unseenPassages.map((p) => p.id));
      const recycledPool = shufflePassages(
        availablePassages.filter((p) => !unseenIds.has(p.id))
      );
      this.usedPassageIds.clear();
      selectedPassages = [...unseenPassages, ...recycledPool].slice(
        0,
        Math.min(availablePassages.length, totalDesired)
      );
    }

    selectedPassages.forEach((passage) => this.usedPassageIds.add(passage.id));

    return {
      teams,
      passages: selectedPassages,
      config: {
        ...config,
        packs: [...config.packs],
      },
    };
  }

  buildHints(passage: VersePassage): VerseHint[] {
    return passage.blanks.map((blank) => {
      const trimmed = blank.answer.trim();
      const firstChar = trimmed.charAt(0).toUpperCase();
      const remainingCount = Math.max(0, trimmed.length - 1);
      const underscores = Array.from({ length: remainingCount }, () => '_').join(
        ' '
      );
      const maskedWord = underscores ? `${firstChar} ${underscores}` : firstChar;

      const wrongOptions = blank.options.filter(
        (opt) => normalizeAnswer(opt) !== normalizeAnswer(blank.answer)
      );
      const eliminatedOptions = wrongOptions.slice(0, 2);

      return {
        index: blank.index,
        maskedWord,
        eliminatedOptions,
      };
    });
  }

  evaluateAnswers(
    passage: VersePassage,
    answersByIndex: Record<number, string>,
    usedHint: boolean
  ): VerseBlankResult[] {
    const pointsPerCorrect = usedHint ? 5 : 10;

    return passage.blanks.map((blank) => {
      const userAnswer = (answersByIndex[blank.index] ?? '').trim();
      const isCorrect =
        userAnswer.length > 0 &&
        normalizeAnswer(userAnswer) === normalizeAnswer(blank.answer);

      return {
        index: blank.index,
        userAnswer,
        expectedAnswer: blank.answer,
        isCorrect,
        acceptedByLeader: false,
        pointsAwarded: isCorrect ? pointsPerCorrect : 0,
      };
    });
  }

  acceptBlankByLeader(
    results: VerseBlankResult[],
    blankIndex: number,
    usedHint: boolean
  ): VerseBlankResult[] {
    const pointsPerCorrect = usedHint ? 5 : 10;

    return results.map((result) => {
      if (result.index !== blankIndex || result.isCorrect) {
        return result;
      }

      return {
        ...result,
        isCorrect: true,
        acceptedByLeader: true,
        pointsAwarded: pointsPerCorrect,
      };
    });
  }

  async recordTeamScore(teamId: string, points: number): Promise<void> {
    if (points < 0) {
      throw new ValidationError('A pontuação não pode ser negativa.');
    }
    await this.teamDataSource.addScore(teamId, points);
  }
}
