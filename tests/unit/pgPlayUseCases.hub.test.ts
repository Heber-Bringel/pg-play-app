import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import type { GameModalityFilter } from '@/model/entities/minigame';
import { ValidationError } from '@/model/errors';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';

describe('PgPlayUseCases — Catálogo e Hub de Jogos (UC01)', () => {
  it('deve listar os 5 minigames oficiais do catálogo no Hub (RF01)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const games = await useCases.listMinigames();

    expect(games).toHaveLength(9);
    expect(games.map((g) => g.id)).toEqual([
      'mimica',
      'quiz',
      'forca',
      'adedonha',
      'cidade-dorme',
      'versiculo',
      'quem-sou-eu',
      'termometro',
      'desenho',
    ]);
    expect(games.find((g) => g.id === 'cidade-dorme')?.available).toBe(true);
    expect(games.find((g) => g.id === 'termometro')?.playersTag).toBe(
      '1 Celular · Encerramento'
    );
    expect(games.find((g) => g.id === 'mimica')?.available).toBe(true);
    expect(games.find((g) => g.id === 'versiculo')?.available).toBe(true);
    expect(games.find((g) => g.id === 'quem-sou-eu')?.available).toBe(true);
    expect(games.find((g) => g.id === 'desenho')?.available).toBe(true);
  });

  it('deve filtrar minigames por texto ignorando acentos, espaços e caixa (RF03)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const mimicaResult = await useCases.listMinigames('  mimica ');
    expect(mimicaResult.map((g) => g.id)).toEqual(['mimica']);

    const biblicoResult = await useCases.listMinigames('BIBLICA');
    expect(biblicoResult.map((g) => g.id)).toEqual([
      'quiz',
      'adedonha',
      'versiculo',
    ]);

    const themeResult = await useCases.listMinigames('roleta');
    expect(themeResult.map((g) => g.id)).toEqual(['adedonha']);
  });

  it('deve filtrar minigames por modalidade 1 Celular e Multi-Celular', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const onePhone = await useCases.listMinigames('', '1 Celular');
    expect(onePhone).toHaveLength(6);
    expect(onePhone.every((g) => g.modality === '1 Celular')).toBe(true);

    const multiplayer = await useCases.listMinigames('', 'Multi-Celular');
    expect(multiplayer).toHaveLength(3);
    expect(multiplayer.every((g) => g.modality === 'Multi-Celular')).toBe(true);
    expect(multiplayer.some((g) => g.id === 'desenho')).toBe(true);
  });

  it('deve combinar busca textual com filtro de modalidade e retornar vazio sem correspondência (RF03, RF04)', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const combined = await useCases.listMinigames('biblico', '1 Celular');
    expect(combined.map((g) => g.id)).toEqual([
      'mimica',
      'quiz',
      'forca',
      'versiculo',
    ]);

    const emptyResult = await useCases.listMinigames('xadrez', 'Todos');
    expect(emptyResult).toHaveLength(0);
  });

  it('deve lançar ValidationError se a modalidade de filtro for inválida', async () => {
    const useCases = new PgPlayUseCases(
      new MemoryTeamDataSource(),
      new MemoryGameCatalogDataSource(),
      new MemoryMatchSettingsDataSource()
    );

    const invalidModality = 'Online' as GameModalityFilter;
    await expect(useCases.listMinigames('', invalidModality)).rejects.toThrow(
      ValidationError
    );
  });
});
