import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

describe('PgPlayUseCases — Gestão e Configuração de Equipes (UC01 / UC02)', () => {
  it('deve listar as 2 equipes sugeridas padrão no primeiro uso (RF05)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const teams = await useCases.listTeams();

    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe('Tribo de Judá');
    expect(teams[1].name).toBe('Leões da Fé');
    expect(teams[0].score).toBe(0);
  });

  it('deve adicionar uma nova equipe com sucesso com pontuação inicial zero (RF06)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const created = await useCases.addTeam('Guerreiros da Fé');

    expect(created.name).toBe('Guerreiros da Fé');
    expect(created.score).toBe(0);

    const teams = await useCases.listTeams();
    expect(teams).toHaveLength(3);
    expect(teams.some((t) => t.name === 'Guerreiros da Fé')).toBe(true);
  });

  it('deve rejeitar nome de equipe com menos de 2 caracteres (RF06)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.addTeam('A')).rejects.toThrow(ValidationError);
    await expect(useCases.addTeam('  ')).rejects.toThrow(
      'Digite um nome com pelo menos 2 letras para a equipe.'
    );
  });

  it('deve rejeitar nome de equipe com mais de 20 caracteres (RF06)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const longName = 'Equipe Com Nome Gigantesco Mais De Vinte';
    await expect(useCases.addTeam(longName)).rejects.toThrow(
      'O nome da equipe deve ter no máximo 20 caracteres.'
    );
  });

  it('deve rejeitar nome de equipe duplicado mesmo com variação de caixa e espaços (RF06)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.addTeam('  tribo de judá  ')).rejects.toThrow(
      'Já existe uma equipe cadastrada com este nome.'
    );
  });

  it('deve impedir adicionar mais de 6 equipes por sessão', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    // Já existem 2 equipes (Tribo de Judá e Leões da Fé)
    await useCases.addTeam('Equipe 3');
    await useCases.addTeam('Equipe 4');
    await useCases.addTeam('Equipe 5');
    await useCases.addTeam('Equipe 6');

    // Tentativa da 7ª equipe deve falhar
    await expect(useCases.addTeam('Equipe 7')).rejects.toThrow(
      'Limite máximo de 6 equipes atingido para a sessão.'
    );
  });

  it('deve remover equipe existente e retornar lista atualizada (RF07)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    const initialTeams = await useCases.listTeams();
    const idToRemove = initialTeams[0].id;

    const remaining = await useCases.removeTeam(idToRemove);

    expect(remaining).toHaveLength(1);
    expect(remaining.find((t) => t.id === idToRemove)).toBeUndefined();
  });

  it('deve lançar ValidationError ao tentar remover equipe inexistente', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.removeTeam('id-fantasma')).rejects.toThrow(
      'Equipe não encontrada para remoção.'
    );
  });

  it('deve lançar ValidationError ao passar identificador vazio para remoção', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs);

    await expect(useCases.removeTeam('   ')).rejects.toThrow(
      'Identificador da equipe é obrigatório para remoção.'
    );
  });
});
