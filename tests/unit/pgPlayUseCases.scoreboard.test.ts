import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

describe('PgPlayUseCases — Regras de Negócio do Placar e Ranking do PG (UC06)', () => {
  it('deve retornar o placar ordenado decrescentemente pela pontuação acumulada (RF16)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 'team-1', name: 'Tribo de Judá', score: 15 },
      { id: 'team-2', name: 'Leões da Fé', score: 40 },
      { id: 'team-3', name: 'Mensageiros', score: 25 },
    ]);
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const ranked = await useCases.getScoreboard();

    expect(ranked.map((t) => t.name)).toEqual([
      'Leões da Fé',
      'Mensageiros',
      'Tribo de Judá',
    ]);
    expect(ranked[0].score).toBe(40);
  });

  it('deve conceder pontos bônus (+10 por padrão) e reordenar o ranking automaticamente (RF16)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 'team-1', name: 'Tribo de Judá', score: 15 },
      { id: 'team-2', name: 'Leões da Fé', score: 20 },
    ]);
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const updated = await useCases.awardBonusPoints('team-1');

    expect(updated[0].id).toBe('team-1');
    expect(updated[0].score).toBe(25);
  });

  it('deve lançar ValidationError ao conceder bônus inválido ou para equipe inexistente', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.awardBonusPoints('   ')).rejects.toThrow(ValidationError);
    await expect(useCases.awardBonusPoints('team-inexistente')).rejects.toThrow(ValidationError);
    await expect(useCases.awardBonusPoints('team-1', 0)).rejects.toThrow(ValidationError);
  });

  it('deve zerar a pontuação de todas as equipes ao reiniciar o placar do encontro (RF17)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 'team-1', name: 'Tribo de Judá', score: 45 },
      { id: 'team-2', name: 'Leões da Fé', score: 30 },
    ]);
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const reset = await useCases.resetScoreboard();

    expect(reset).toHaveLength(2);
    expect(reset.every((team) => team.score === 0)).toBe(true);
  });
});
