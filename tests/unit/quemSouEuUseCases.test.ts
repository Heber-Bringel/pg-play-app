import { MemoryQuemSouEuDataSource } from '@/infra/datasources/memoryQuemSouEuDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryHapticService } from '@/infra/services/memoryHapticService';
import { MemoryTiltSensorService } from '@/infra/services/memoryTiltSensorService';
import type { QuemSouEuPack } from '@/model/entities/quemSouEuCard';
import { ValidationError } from '@/model/errors';
import { QuemSouEuUseCases } from '@/usecase/quemSouEuUseCases';

const ALL_PACKS: QuemSouEuPack[] = [
  'Famosos',
  'Animais',
  'Filmes e Séries',
  'Desenhos e Animações',
  'Profissões',
  'Comidas',
  'Objetos do Dia a Dia',
  'Lugares do Mundo',
];

describe('QuemSouEuUseCases (UC09 / RF32–RF34)', () => {
  it('prepara partida com cartas genéricas embaralhadas e sem repetição', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const tiltService = new MemoryTiltSensorService();
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    const prepared = await useCases.prepareMatch({
      packs: ['Animais', 'Comidas'],
      durationSeconds: 60,
      roundsPerTeam: 2,
      tiltEnabled: true,
    });

    expect(prepared.teams.length).toBeGreaterThanOrEqual(2);
    expect(prepared.cards.length).toBeGreaterThan(0);
    expect(
      prepared.cards.every(
        (card) => card.pack === 'Animais' || card.pack === 'Comidas'
      )
    ).toBe(true);

    const uniqueIds = new Set(prepared.cards.map((card) => card.id));
    expect(uniqueIds.size).toBe(prepared.cards.length);
  });

  it('garante que o banco contém apenas pacotes genéricos e nenhum conteúdo bíblico', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const allCards = await cardDs.listCards();

    expect(allCards.length).toBeGreaterThanOrEqual(40);
    for (const card of allCards) {
      expect(ALL_PACKS).toContain(card.pack);
      expect(card.pack.toLowerCase()).not.toContain('bíblico');
      expect(card.pack.toLowerCase()).not.toContain('biblico');
      expect(card.name.toLowerCase()).not.toContain('moisés');
      expect(card.name.toLowerCase()).not.toContain('davi');
    }
  });

  it('lança ValidationError quando há menos de 2 equipes cadastradas', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource([
      { id: 'team-1', name: 'Equipe Única', score: 0 },
    ]);
    const tiltService = new MemoryTiltSensorService();
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    await expect(
      useCases.prepareMatch({
        packs: ['Animais'],
        durationSeconds: 60,
        roundsPerTeam: 2,
        tiltEnabled: true,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError quando nenhum pacote é selecionado', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const tiltService = new MemoryTiltSensorService();
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    await expect(
      useCases.prepareMatch({
        packs: [],
        durationSeconds: 60,
        roundsPerTeam: 2,
        tiltEnabled: true,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError quando rodadas por equipe está fora de 1 a 5', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const tiltService = new MemoryTiltSensorService();
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    await expect(
      useCases.prepareMatch({
        packs: ['Famosos'],
        durationSeconds: 60,
        roundsPerTeam: 6,
        tiltEnabled: true,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('lança ValidationError no modo Inclinação sem sensor e aceita o modo Botões', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const tiltService = new MemoryTiltSensorService(false);
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    await expect(
      useCases.prepareMatch({
        packs: ['Famosos'],
        durationSeconds: 60,
        roundsPerTeam: 2,
        tiltEnabled: true,
      })
    ).rejects.toThrow(ValidationError);

    const prepared = await useCases.prepareMatch({
      packs: ['Famosos'],
      durationSeconds: 60,
      roundsPerTeam: 2,
      tiltEnabled: false,
    });
    expect(prepared.config.tiltEnabled).toBe(false);
  });

  it('atribui +10 pontos por acerto e 0 pontos por passe sem penalidade e aciona háptica', () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const tiltService = new MemoryTiltSensorService();
    const hapticService = new MemoryHapticService();
    const useCases = new QuemSouEuUseCases(
      cardDs,
      teamDs,
      tiltService,
      undefined,
      hapticService
    );

    const card = { id: 'c1', name: 'Leão', pack: 'Animais' as const };
    const hit = useCases.recordCardOutcome(card, 'hit');
    const pass = useCases.recordCardOutcome(card, 'pass');

    expect(hit.pointsAwarded).toBe(10);
    expect(hit.outcome).toBe('hit');
    expect(pass.pointsAwarded).toBe(0);
    expect(pass.outcome).toBe('pass');
    expect(hapticService.getCounts()).toEqual({ hits: 1, passes: 1 });
  });

  it('envia pontos ao Placar Geral e rejeita pontuação negativa', async () => {
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const tiltService = new MemoryTiltSensorService();
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    const teamsBefore = await useCases.listTeams();
    const targetTeam = teamsBefore[0];

    await useCases.recordTeamScore(targetTeam.id, 30);
    const teamsAfter = await useCases.listTeams();
    const updated = teamsAfter.find((t) => t.id === targetTeam.id);
    expect(updated?.score).toBe(targetTeam.score + 30);

    await expect(useCases.recordTeamScore(targetTeam.id, -10)).rejects.toThrow(
      ValidationError
    );
  });

  it('respeita cooldown de 1 segundo no MemoryTiltSensorService', () => {
    let fakeNow = 1000;
    const tiltService = new MemoryTiltSensorService(true, () => fakeNow);
    const cardDs = new MemoryQuemSouEuDataSource();
    const teamDs = new MemoryTeamDataSource();
    const useCases = new QuemSouEuUseCases(cardDs, teamDs, tiltService);

    const gestures: string[] = [];
    const unsubscribe = useCases.subscribeTiltSensor((gesture) => {
      gestures.push(gesture);
    }, 1000);

    tiltService.emitGesture('hit');
    fakeNow += 500; // Ainda dentro do cooldown de 1s
    tiltService.emitGesture('pass');
    fakeNow += 600; // Passou 1.1s do primeiro gesto
    tiltService.emitGesture('pass');

    unsubscribe();
    fakeNow += 2000;
    tiltService.emitGesture('hit');

    expect(gestures).toEqual(['hit', 'pass']);
  });
});
