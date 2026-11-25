import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { ValidationError } from '@/model/errors';
import {
  DEFAULT_DESENHO_HIT_POINTS,
  DEFAULT_DESENHO_SKIP_PENALTY,
  PgPlayUseCases,
} from '@/usecase/pgPlayUseCases';

describe('PgPlayUseCases — Regras de Negócio do Desenho Relâmpago (UC12)', () => {
  const buildSut = (
    teams?: ConstructorParameters<typeof MemoryTeamDataSource>[0]
  ) => {
    const teamDs = new MemoryTeamDataSource(teams);
    const catalogDs = new MemoryGameCatalogDataSource();
    const settingsDs = new MemoryMatchSettingsDataSource();
    const useCases = new PgPlayUseCases(teamDs, catalogDs, settingsDs);
    return { useCases, teamDs, catalogDs, settingsDs };
  };

  it('deve expor o card Desenho Relâmpago no Hub e listar os 5 pacotes próprios desenháveis (RF44)', async () => {
    const { useCases } = buildSut();

    const games = await useCases.listMinigames('desenho');
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({
      id: 'desenho',
      title: 'Desenho Relâmpago',
      route: '/desenho',
      icon: 'palette',
      modality: '1 Celular',
      available: true,
    });

    const packs = await useCases.listContentPacks('desenho');
    expect(packs).toHaveLength(5);
    expect(packs.map((pack) => pack.category)).toEqual([
      'Bíblico',
      'Animais',
      'Objetos',
      'Comidas',
      'Lugares e Natureza',
    ]);
  });

  it('deve listar e filtrar cartas desenháveis por categorias selecionadas (RF28, RF44)', async () => {
    const { useCases } = buildSut();

    const allCards = await useCases.listDesenhoCards();
    expect(allCards.length).toBeGreaterThanOrEqual(20);

    const biblical = await useCases.listDesenhoCards(['Bíblico']);
    expect(biblical.length).toBeGreaterThan(0);
    expect(biblical.every((card) => card.category === 'Bíblico')).toBe(true);

    const combined = await useCases.listDesenhoCards(['Bíblico', 'Animais']);
    expect(combined.length).toBeGreaterThan(biblical.length);
    expect(
      combined.every(
        (card) => card.category === 'Bíblico' || card.category === 'Animais'
      )
    ).toBe(true);
  });

  it('deve lançar ValidationError ao solicitar cartas com lista vazia de pacotes (RF28, RF44)', async () => {
    const { useCases } = buildSut();

    await expect(useCases.listDesenhoCards([])).rejects.toThrow(ValidationError);
  });

  it('deve somar +20 pontos no acerto e descontar até 5 pontos no pulo respeitando piso 0 (RF43)', async () => {
    const { useCases } = buildSut([
      { id: 'team-1', name: 'Tribo de Judá', score: 0 },
      { id: 'team-2', name: 'Leões da Fé', score: 3 },
    ]);

    expect(DEFAULT_DESENHO_HIT_POINTS).toBe(20);
    expect(DEFAULT_DESENHO_SKIP_PENALTY).toBe(5);

    const afterHit = await useCases.scoreDesenhoHit('team-1');
    expect(afterHit.find((team) => team.id === 'team-1')?.score).toBe(20);

    const afterSkipWithSaldo = await useCases.scoreDesenhoSkip('team-1');
    expect(afterSkipWithSaldo.find((team) => team.id === 'team-1')?.score).toBe(15);

    // Piso zero quando a equipe tem menos que 5 pts ou 0 pts
    const afterSkipFloor = await useCases.scoreDesenhoSkip('team-2');
    expect(afterSkipFloor.find((team) => team.id === 'team-2')?.score).toBe(0);

    const afterSkipAtZero = await useCases.scoreDesenhoSkip('team-2');
    expect(afterSkipAtZero.find((team) => team.id === 'team-2')?.score).toBe(0);
  });

  it('deve lançar ValidationError para teamId inválido ou valores de pontuação incorretos (RF43)', async () => {
    const { useCases } = buildSut();

    await expect(useCases.scoreDesenhoHit('   ')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreDesenhoHit('inexistente')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreDesenhoHit('team-1', 0)).rejects.toThrow(ValidationError);

    await expect(useCases.scoreDesenhoSkip('')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreDesenhoSkip('inexistente')).rejects.toThrow(ValidationError);
    await expect(useCases.scoreDesenhoSkip('team-1', -2)).rejects.toThrow(ValidationError);
  });
});
