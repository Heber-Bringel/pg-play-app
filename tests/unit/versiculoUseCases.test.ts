import { HelloAoVerseDataSource } from '@/infra/datasources/helloAoVerseDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryVerseDataSource } from '@/infra/datasources/memoryVerseDataSource';
import { ValidationError } from '@/model/errors';
import { VersiculoUseCases } from '@/usecase/versiculoUseCases';

describe('VersiculoUseCases', () => {
  const buildSut = (initialTeamNames = ['Equipe Alfa', 'Equipe Beta']) => {
    const teamDataSource = new MemoryTeamDataSource(
      initialTeamNames.map((name, index) => ({
        id: `team-${index + 1}`,
        name,
        score: 0,
      }))
    );
    const verseDataSource = new MemoryVerseDataSource();
    const useCases = new VersiculoUseCases(verseDataSource, teamDataSource);
    return { useCases, teamDataSource, verseDataSource };
  };

  it('prepara partida com passagens sem repetição dos pacotes selecionados', async () => {
    const { useCases } = buildSut();

    const prepared = await useCases.prepareMatch({
      packs: ['Evangelhos'],
      durationSeconds: 45,
      passagesPerTeam: 2,
    });

    expect(prepared.teams).toHaveLength(2);
    expect(prepared.passages).toHaveLength(3);
    const ids = prepared.passages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(prepared.passages.every((p) => p.pack === 'Evangelhos')).toBe(true);
  });

  it('lança ValidationError quando há menos de 2 equipes cadastradas', async () => {
    const { useCases } = buildSut(['Só Uma Equipe']);

    await expect(
      useCases.prepareMatch({
        packs: ['Evangelhos'],
        durationSeconds: 45,
        passagesPerTeam: 3,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('lança ValidationError quando nenhum pacote é selecionado', async () => {
    const { useCases } = buildSut();

    await expect(
      useCases.prepareMatch({
        packs: [],
        durationSeconds: 45,
        passagesPerTeam: 3,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('lança ValidationError para duração ou quantidade de passagens fora da faixa', async () => {
    const { useCases } = buildSut();

    await expect(
      useCases.prepareMatch({
        packs: ['Evangelhos'],
        durationSeconds: 90 as 45,
        passagesPerTeam: 3,
      })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      useCases.prepareMatch({
        packs: ['Evangelhos'],
        durationSeconds: 45,
        passagesPerTeam: 6,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('valida respostas ignorando acentos e maiúsculas e pontua +10 sem dica', async () => {
    const { useCases, verseDataSource } = buildSut();
    const [joao316] = await verseDataSource.listPassages(['Evangelhos']);

    const results = useCases.evaluateAnswers(
      joao316,
      { 1: 'UNIGENITO', 2: 'Pereca' },
      false
    );

    expect(results).toHaveLength(2);
    expect(results[0].isCorrect).toBe(true);
    expect(results[0].pointsAwarded).toBe(10);
    expect(results[1].isCorrect).toBe(true);
    expect(results[1].pointsAwarded).toBe(10);
  });

  it('pontua +5 por lacuna correta quando a dica foi usada e 0 para errada ou vazia', async () => {
    const { useCases, verseDataSource } = buildSut();
    const [joao316] = await verseDataSource.listPassages(['Evangelhos']);

    const hints = useCases.buildHints(joao316);
    expect(hints[0].maskedWord.startsWith('U ')).toBe(true);
    expect(hints[0].eliminatedOptions).toHaveLength(2);
    expect(hints[0].eliminatedOptions).not.toContain('unigênito');

    const results = useCases.evaluateAnswers(
      joao316,
      { 1: 'unigenito', 2: '' },
      true
    );

    expect(results[0].isCorrect).toBe(true);
    expect(results[0].pointsAwarded).toBe(5);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].pointsAwarded).toBe(0);
  });

  it('registra a pontuação da equipe no placar', async () => {
    const { useCases, teamDataSource } = buildSut();

    await useCases.recordTeamScore('team-1', 15);
    const stored = await teamDataSource.listTeams();
    expect(stored[0].score).toBe(15);
  });

  it('evita repetir passagens entre partidas consecutivas até esgotar o banco', async () => {
    const { useCases } = buildSut();

    const firstMatch = await useCases.prepareMatch({
      packs: ['Evangelhos'],
      durationSeconds: 45,
      passagesPerTeam: 1,
    });
    const secondMatch = await useCases.prepareMatch({
      packs: ['Evangelhos'],
      durationSeconds: 45,
      passagesPerTeam: 1,
    });

    const firstIds = new Set(firstMatch.passages.map((p) => p.id));
    const unseenInSecond = secondMatch.passages.filter(
      (p) => !firstIds.has(p.id)
    );
    expect(firstMatch.passages).toHaveLength(2);
    expect(secondMatch.passages).toHaveLength(2);
    expect(unseenInSecond).toHaveLength(1);
  });
});

describe('HelloAoVerseDataSource', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('busca versículos dinamicamente na API HelloAO e cria lacunas sem stopwords', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        translation: { name: 'Bíblia Livre' },
        book: { name: 'Filipenses' },
        chapter: {
          content: [
            {
              type: 'verse',
              number: 13,
              text: 'Tudo posso naquele que me fortalece e sustenta continuamente.',
            },
          ],
        },
      }),
    } as unknown as Response);

    const dataSource = new HelloAoVerseDataSource(new MemoryVerseDataSource());
    const passages = await dataSource.listPassages(['Cartas de Paulo']);

    expect(passages.length).toBeGreaterThan(0);
    expect(passages[0].reference).toMatch(/^Filipenses \d+:13$/);
    expect(passages[0].translation).toBe('Bíblia Livre');
    expect(passages[0].textWithBlanks).toContain('______ (1)');
    expect(passages[0].blanks.length).toBeGreaterThanOrEqual(1);
    expect(passages[0].blanks[0].options).toHaveLength(4);
    expect(passages[0].blanks[0].options).toContain(
      passages[0].blanks[0].answer
    );
  });

  it('faz fallback automático para MemoryVerseDataSource quando a rede falha', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

    const dataSource = new HelloAoVerseDataSource(new MemoryVerseDataSource());
    const passages = await dataSource.listPassages(['Evangelhos']);

    expect(passages).toHaveLength(3);
    expect(passages[0].reference).toContain('João');
  });
});
