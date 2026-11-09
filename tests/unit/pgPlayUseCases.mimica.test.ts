import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { AuthError, DataSourceError, DomainError, ValidationError } from '@/model/errors';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

describe('PgPlayUseCases — Regras de Negócio da Arena de Mímica Expressiva (UC03)', () => {
  it('deve listar as equipes padrão sugeridas e o banco de cartas da Mímica', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const teams = await useCases.listTeams();
    const cards = await useCases.listMimicaCards();

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('Tribo de Judá');
    expect(teams[1].name).toBe('Leões da Fé');
    expect(cards.length).toBeGreaterThanOrEqual(10);
  });

  it('deve filtrar cartas da Mímica apenas pelos pacotes de categorias selecionados (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const biblicalCards = await useCases.listMimicaCards(['Bíblico']);

    expect(biblicalCards.length).toBeGreaterThan(0);
    expect(biblicalCards.every((card) => card.category === 'Bíblico')).toBe(true);
  });

  it('deve lançar ValidationError ao solicitar cartas da Mímica com lista de categorias vazia (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.listMimicaCards([])).rejects.toThrow(ValidationError);
  });

  it('deve somar +20 pontos à equipe da vez ao registrar acerto na Mímica (RF13)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const updatedTeams = await useCases.scoreMimicaHit('team-1');
    const team1 = updatedTeams.find((team) => team.id === 'team-1');

    expect(team1?.score).toBe(20);
  });

  it('deve descontar 5 pontos ao pular palavra quando a equipe possui saldo suficiente (RF25)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 'team-1', name: 'Tribo de Judá', score: 20 },
      { id: 'team-2', name: 'Leões da Fé', score: 0 },
    ]);
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const updatedTeams = await useCases.scoreMimicaSkip('team-1');
    const team1 = updatedTeams.find((team) => team.id === 'team-1');

    expect(team1?.score).toBe(15);
  });

  it('não deve permitir pontuação negativa ao pular palavra com placar zero ou menor que 5 (RF25)', async () => {
    const teamDs = new MemoryTeamDataSource([
      { id: 'team-1', name: 'Tribo de Judá', score: 0 },
      { id: 'team-2', name: 'Leões da Fé', score: 3 },
    ]);
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const afterZeroSkip = await useCases.scoreMimicaSkip('team-1');
    expect(afterZeroSkip.find((t) => t.id === 'team-1')?.score).toBe(0);

    const afterThreeSkip = await useCases.scoreMimicaSkip('team-2');
    expect(afterThreeSkip.find((t) => t.id === 'team-2')?.score).toBe(0);
  });

  it('deve lançar ValidationError para identificadores de equipe inválidos ou valores incorretos', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.scoreMimicaHit('   ')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreMimicaHit('team-inexistente')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreMimicaHit('team-1', 0)).rejects.toThrow(ValidationError);

    await expect(useCases.scoreMimicaSkip('')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreMimicaSkip('team-inexistente')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreMimicaSkip('team-1', -1)).rejects.toThrow(ValidationError);
  });

  it('deve suportar operações auxiliares do MemoryTeamDataSource e hierarquia de erros de domínio', async () => {
    const teamDs = new MemoryTeamDataSource();
    const added = await teamDs.addTeam('Mensageiros');
    expect(added.name).toBe('Mensageiros');

    await teamDs.addScore(added.id, 20);
    await teamDs.resetScores();
    const afterReset = await teamDs.listTeams();
    expect(afterReset.every((t) => t.score === 0)).toBe(true);

    await teamDs.removeTeam(added.id);
    const afterRemove = await teamDs.listTeams();
    expect(afterRemove).toHaveLength(2);

    const domainErr = new DomainError('Erro base');
    const authErr = new AuthError('Não autorizado');
    const dsErr = new DataSourceError('Falha de leitura');
    expect(domainErr.name).toBe('DomainError');
    expect(authErr).toBeInstanceOf(DomainError);
    expect(dsErr).toBeInstanceOf(DomainError);
  });
});
