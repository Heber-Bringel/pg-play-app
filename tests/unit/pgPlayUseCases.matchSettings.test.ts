import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { DEFAULT_MATCH_SETTINGS, type MatchSettings } from '@/model/entities/matchSettings';
import { ValidationError } from '@/model/errors';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

describe('PgPlayUseCases — Parâmetros da Partida (RF29)', () => {
  const buildSut = () => {
    const settingsDs = new MemoryMatchSettingsDataSource();
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      settingsDs
    );
    return { useCases, settingsDs };
  };

  it('retorna valores padrão ao carregar parâmetros iniciais', async () => {
    const { useCases } = buildSut();

    const settings = await useCases.getMatchSettings();

    expect(settings).toEqual(DEFAULT_MATCH_SETTINGS);
  });

  it('valida e persiste parâmetros válidos de Mímica, Quiz e Forca', async () => {
    const { useCases, settingsDs } = buildSut();

    await useCases.updateMimicaSettings({ durationSeconds: 90, totalRounds: 5 });
    await useCases.updateQuizSettings({ durationSeconds: 30, questionCount: 10 });
    await useCases.updateForcaSettings({ maxAttempts: 8, totalRounds: 4 });

    const persisted = await settingsDs.getSettings();
    expect(persisted.mimica).toEqual({ durationSeconds: 90, totalRounds: 5 });
    expect(persisted.quiz).toEqual({ durationSeconds: 30, questionCount: 10 });
    expect(persisted.forca).toEqual({ maxAttempts: 8, totalRounds: 4 });
  });

  it('lança ValidationError para parâmetros fora das faixas permitidas', async () => {
    const { useCases } = buildSut();

    await expect(
      useCases.updateMimicaSettings({ durationSeconds: 10 as 60, totalRounds: 3 })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      useCases.updateMimicaSettings({ durationSeconds: 60, totalRounds: 6 })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      useCases.updateQuizSettings({ durationSeconds: 25 as 20, questionCount: 5 })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      useCases.updateQuizSettings({ durationSeconds: 20, questionCount: 25 as 5 })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      useCases.updateForcaSettings({ maxAttempts: 3 as 5, totalRounds: 3 })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      useCases.updateForcaSettings({ maxAttempts: 5, totalRounds: 0 })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('altera só o campo informado e mantém os demais parâmetros', async () => {
    const { useCases } = buildSut();

    await useCases.updateMimicaSettings({ durationSeconds: 90, totalRounds: 4 });
    const result = await useCases.updateMimicaSettings({ totalRounds: 2 });

    expect(result.mimica).toEqual({ durationSeconds: 90, totalRounds: 2 });
    expect(result.quiz).toEqual(DEFAULT_MATCH_SETTINGS.quiz);
  });

  it('serializa gravações simultâneas sem perder nenhuma alteração', async () => {
    const { useCases, settingsDs } = buildSut();

    await Promise.all([
      useCases.updateQuizSettings({ durationSeconds: 30 }),
      useCases.updateQuizSettings({ questionCount: 15 }),
      useCases.updateForcaSettings({ maxAttempts: 8 }),
      useCases.updateMimicaSettings({ totalRounds: 1 }),
    ]);

    const persisted = await settingsDs.getSettings();
    expect(persisted.quiz).toEqual({ durationSeconds: 30, questionCount: 15 });
    expect(persisted.forca.maxAttempts).toBe(8);
    expect(persisted.mimica.totalRounds).toBe(1);
  });

  it('continua aceitando gravações depois de uma falha de validação', async () => {
    const { useCases } = buildSut();

    await expect(
      useCases.updateForcaSettings({ totalRounds: 9 })
    ).rejects.toBeInstanceOf(ValidationError);
    const result = await useCases.updateForcaSettings({ totalRounds: 2 });

    expect(result.forca.totalRounds).toBe(2);
  });

  it('troca valores inválidos do armazenamento pelos padrões ao carregar', async () => {
    const corrupted = {
      mimica: { durationSeconds: 10, totalRounds: 9 },
      quiz: { durationSeconds: 30, questionCount: 25 },
      forca: { maxAttempts: 8, totalRounds: 2.5 },
    } as unknown as MatchSettings;
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource(corrupted)
    );

    const settings = await useCases.getMatchSettings();

    expect(settings.mimica).toEqual(DEFAULT_MATCH_SETTINGS.mimica);
    expect(settings.quiz).toEqual({ durationSeconds: 30, questionCount: 10 });
    expect(settings.forca).toEqual({ maxAttempts: 8, totalRounds: 3 });
  });

  describe('planQuizMatch — alternância justa entre equipes', () => {
    it('arredonda para um múltiplo do número de equipes', () => {
      const { useCases } = buildSut();

      expect(useCases.planQuizMatch(5, 12, 2)).toEqual({
        totalQuestions: 4,
        questionsPerTeam: 2,
        limitedByBank: false,
      });
      expect(useCases.planQuizMatch(10, 12, 3)).toEqual({
        totalQuestions: 9,
        questionsPerTeam: 3,
        limitedByBank: false,
      });
      expect(useCases.planQuizMatch(10, 12, 2).totalQuestions).toBe(10);
    });

    it('respeita o tamanho do banco e sinaliza quando ele limita a partida', () => {
      const { useCases } = buildSut();

      expect(useCases.planQuizMatch(15, 12, 2)).toEqual({
        totalQuestions: 12,
        questionsPerTeam: 6,
        limitedByBank: true,
      });
    });

    it('não zera a partida quando há menos perguntas que equipes', () => {
      const { useCases } = buildSut();

      expect(useCases.planQuizMatch(5, 2, 3).totalQuestions).toBe(2);
      expect(useCases.planQuizMatch(5, 12, 0).totalQuestions).toBe(5);
    });
  });
});
