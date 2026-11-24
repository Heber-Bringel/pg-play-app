import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import {
  DEFAULT_QUIZ_CORRECT_POINTS,
  PgPlayUseCases,
} from '@/usecase/pgPlayUseCases';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';

describe('PgPlayUseCases — Regras de Negócio do Quiz Relâmpago (UC04)', () => {
  it('deve listar as perguntas do banco de Quiz com 4 alternativas cada (RF14)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const questions = await useCases.listQuizQuestions();

    expect(questions.length).toBeGreaterThanOrEqual(10);
    const first = questions[0];
    expect(first.question).toBeDefined();
    expect(first.options).toHaveLength(4);
    expect(first.correctKey).toMatch(/^[A-D]$/);
  });

  it('deve filtrar perguntas de Quiz por categorias selecionadas (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const packs = await useCases.listContentPacks('quiz');
    expect(packs).toHaveLength(7);
    expect(packs.every((pack) => pack.gameId === 'quiz')).toBe(true);

    const biblical = await useCases.listQuizQuestions(['Bíblico']);

    expect(biblical.length).toBeGreaterThan(0);
    expect(biblical.every((q) => q.category === 'Bíblico')).toBe(true);

    const combined = await useCases.listQuizQuestions(['Bíblico', 'Ciência']);
    expect(combined.length).toBeGreaterThan(biblical.length);
    expect(
      combined.every((q) => q.category === 'Bíblico' || q.category === 'Ciência')
    ).toBe(true);
  });

  it('deve lançar ValidationError se categorias for array vazio (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.listQuizQuestions([])).rejects.toThrow(ValidationError);
  });

  it('deve somar +10 pts para a equipe quando a resposta for correta (RF14, RF26)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const teamsBefore = await useCases.listTeams();
    const targetTeam = teamsBefore[0];
    const initialScore = targetTeam.score;

    const updated = await useCases.scoreQuizAnswer(targetTeam.id, true);
    const updatedTeam = updated.find((t) => t.id === targetTeam.id);

    expect(updatedTeam?.score).toBe(initialScore + DEFAULT_QUIZ_CORRECT_POINTS);
  });

  it('deve manter a pontuação inalterada (0 pts) quando a resposta for incorreta (RF26)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const teamsBefore = await useCases.listTeams();
    const targetTeam = teamsBefore[0];
    const initialScore = targetTeam.score;

    const updated = await useCases.scoreQuizAnswer(targetTeam.id, false);
    const updatedTeam = updated.find((t) => t.id === targetTeam.id);

    expect(updatedTeam?.score).toBe(initialScore);
  });

  it('deve lançar ValidationError ao pontuar com identificador de equipe vazio', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.scoreQuizAnswer('   ', true)).rejects.toThrow(
      'Identificador da equipe é obrigatório para pontuar.'
    );
  });

  it('deve lançar ValidationError se equipe não for encontrada para pontuação', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.scoreQuizAnswer('id-inexistente', true)).rejects.toThrow(
      'Equipe não encontrada para pontuação no Quiz.'
    );
  });

  it('deve lançar ValidationError se points <= 0', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.scoreQuizAnswer('team-1', true, 0)).rejects.toThrow(
      'A pontuação por acerto deve ser maior que zero.'
    );
  });
});
