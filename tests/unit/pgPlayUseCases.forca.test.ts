import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import {
  IBGE_FORCA_PUZZLES,
  MemoryIbgeForcaDataSource,
} from '@/infra/datasources/memoryIbgeForcaDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import {
  DEFAULT_FORCA_ATTEMPT_BONUS,
  DEFAULT_FORCA_WIN_POINTS,
  PgPlayUseCases,
} from '@/usecase/pgPlayUseCases';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';

describe('PgPlayUseCases — Regras de Negócio do Jogo da Forca (UC05)', () => {
  it('deve listar as palavras e temas do Jogo da Forca (RF15)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const puzzles = await useCases.listForcaPuzzles();

    expect(puzzles.length).toBeGreaterThanOrEqual(10);
    const comunhao = puzzles.find((p) => p.word === 'COMUNHÃO');
    expect(comunhao).toBeDefined();
    expect(comunhao?.hint).toBe('Propósito essencial de um Pequeno Grupo (PG)');
    expect(comunhao?.category).toBe('Bíblico');
  });

  it('deve filtrar palavras da Forca apenas pelas categorias selecionadas (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const packs = await useCases.listContentPacks('forca');
    expect(packs).toHaveLength(7);
    expect(packs.every((pack) => pack.gameId === 'forca')).toBe(true);

    const biblicalPuzzles = await useCases.listForcaPuzzles(['Bíblico']);

    expect(biblicalPuzzles.length).toBeGreaterThan(0);
    expect(biblicalPuzzles.every((p) => p.category === 'Bíblico')).toBe(true);

    const combinedPuzzles = await useCases.listForcaPuzzles(['Bíblico', 'Animais']);
    expect(combinedPuzzles.length).toBeGreaterThan(biblicalPuzzles.length);
    expect(
      combinedPuzzles.every(
        (p) => p.category === 'Bíblico' || p.category === 'Animais'
      )
    ).toBe(true);
  });

  it('deve lançar ValidationError se categorias for array vazio (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.listForcaPuzzles([])).rejects.toThrow(ValidationError);
  });

  it('deve somar +30 pts mais +2 pts por tentativa restante na vitória da Forca (RF27)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const remainingAttempts = 5;
    const expectedPoints =
      DEFAULT_FORCA_WIN_POINTS + remainingAttempts * DEFAULT_FORCA_ATTEMPT_BONUS; // 30 + 10 = 40

    const updatedTeams = await useCases.scoreForcaWord('team-1', remainingAttempts);
    const team1 = updatedTeams.find((t) => t.id === 'team-1');

    expect(team1?.score).toBe(expectedPoints);
  });

  it('não deve somar pontos em caso de derrota (0 tentativas restantes) (RF27)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    const updatedTeams = await useCases.scoreForcaWord('team-1', 0);
    const team1 = updatedTeams.find((t) => t.id === 'team-1');

    expect(team1?.score).toBe(0);
  });

  it('deve lançar ValidationError ao pontuar com teamId inválido ou não cadastrado', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.scoreForcaWord('   ', 3)).rejects.toThrow(ValidationError);
    await expect(useCases.scoreForcaWord('time-fantasma', 3)).rejects.toThrow(ValidationError);
  });

  it('deve lançar ValidationError se remainingAttempts for negativo', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = new MemoryGameCatalogDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, new MemoryMatchSettingsDataSource());

    await expect(useCases.scoreForcaWord('team-1', -1)).rejects.toThrow(ValidationError);
  });

  it('deve mesclar localidades do IBGE no pacote Países e Cidades preservando PORTUGAL sem duplicata (RF28)', async () => {
    const teamDs = new MemoryTeamDataSource();
    const catalogDs = MemoryGameCatalogDataSource.withIbgeLocalidades(
      new MemoryIbgeForcaDataSource()
    );
    const useCases = new PgPlayUseCases(
      teamDs,
      catalogDs,
      new MemoryMatchSettingsDataSource()
    );

    const paisesECidades = await useCases.listForcaPuzzles(['Países e Cidades']);

    // PORTUGAL já existe tanto no catálogo manual ('forca-6') quanto no IBGE ('forca-ibge-pais-620')
    expect(paisesECidades).toHaveLength(IBGE_FORCA_PUZZLES.length);

    const portugalMatches = paisesECidades.filter((p) => p.word === 'PORTUGAL');
    expect(portugalMatches).toHaveLength(1);
    expect(portugalMatches[0].id).toBe('forca-6');
    expect(portugalMatches[0].hint).toBe(
      'País europeu de onde partiu Pedro Álvares Cabral'
    );

    const teresina = paisesECidades.find((p) => p.word === 'TERESINA');
    expect(teresina).toBeDefined();
    expect(teresina?.hint).toBe('Capital do estado do Piauí');
  });
});
