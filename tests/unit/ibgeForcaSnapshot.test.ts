import {
  IBGE_FORCA_PUZZLES,
  MemoryIbgeForcaDataSource,
} from '@/infra/datasources/memoryIbgeForcaDataSource';

const VALID_WORD_REGEX = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ -]+$/;
const IGNORED_CONNECTIVES = new Set(['DE', 'DO', 'DA', 'DOS', 'DAS', 'E']);

function normalizeText(value: string): string {
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSignificantTokens(value: string): string[] {
  return normalizeText(value)
    .split(/[^A-Z]+/)
    .filter((token) => token.length >= 3 && !IGNORED_CONNECTIVES.has(token));
}

describe('MemoryIbgeForcaDataSource — Snapshot Local de Localidades do IBGE (RF28)', () => {
  it('deve conter exatamente as 27 capitais brasileiras e pelo menos 100 países curados', () => {
    const capitals = IBGE_FORCA_PUZZLES.filter((p) =>
      p.id.startsWith('forca-ibge-capital-')
    );
    const countries = IBGE_FORCA_PUZZLES.filter((p) =>
      p.id.startsWith('forca-ibge-pais-')
    );

    expect(capitals).toHaveLength(27);
    expect(countries.length).toBeGreaterThanOrEqual(100);
    expect(capitals.length + countries.length).toBe(IBGE_FORCA_PUZZLES.length);
  });

  it('deve incluir as renomeações canônicas e capitais com dicas especiais', () => {
    const words = new Set(IBGE_FORCA_PUZZLES.map((p) => p.word));

    expect(words.has('RÚSSIA')).toBe(true);
    expect(words.has('ESTADOS UNIDOS')).toBe(true);
    expect(words.has('COREIA DO NORTE')).toBe(true);
    expect(words.has('COREIA DO SUL')).toBe(true);
    expect(words.has('NÍGER')).toBe(true);
    expect(words.has('BIELORRÚSSIA')).toBe(true);

    const teresina = IBGE_FORCA_PUZZLES.find((p) => p.word === 'TERESINA');
    expect(teresina?.hint).toBe('Capital do estado do Piauí');

    const brasilia = IBGE_FORCA_PUZZLES.find((p) => p.word === 'BRASÍLIA');
    expect(brasilia?.hint).toBe('Capital do Brasil');

    const saoPaulo = IBGE_FORCA_PUZZLES.find((p) => p.word === 'SÃO PAULO');
    expect(saoPaulo?.hint).toBe(
      'Capital da unidade federativa mais populosa do Brasil'
    );

    const rioDeJaneiro = IBGE_FORCA_PUZZLES.find(
      (p) => p.word === 'RIO DE JANEIRO'
    );
    expect(rioDeJaneiro?.hint).toBe(
      'Capital fluminense conhecida pelo Cristo Redentor'
    );
  });

  it('deve garantir unicidade de IDs e palavras, tamanho <= 20 e regex válida', () => {
    const seenIds = new Set<string>();
    const seenWords = new Set<string>();

    for (const puzzle of IBGE_FORCA_PUZZLES) {
      expect(seenIds.has(puzzle.id)).toBe(false);
      seenIds.add(puzzle.id);

      const normWord = normalizeText(puzzle.word);
      expect(seenWords.has(normWord)).toBe(false);
      seenWords.add(normWord);

      expect(puzzle.word.length).toBeGreaterThanOrEqual(2);
      expect(puzzle.word.length).toBeLessThanOrEqual(20);
      expect(VALID_WORD_REGEX.test(puzzle.word)).toBe(true);
      expect(puzzle.category).toBe('Países e Cidades');
    }
  });

  it('não deve vazar a resposta inteira nem nenhum vocábulo significativo (>= 3 letras) na dica', () => {
    for (const puzzle of IBGE_FORCA_PUZZLES) {
      expect(puzzle.hint.trim().length).toBeGreaterThan(0);

      const normWord = normalizeText(puzzle.word);
      const normHint = normalizeText(puzzle.hint);

      expect(normHint.includes(normWord)).toBe(false);

      const wordTokens = extractSignificantTokens(puzzle.word);
      const hintTokens = new Set(extractSignificantTokens(puzzle.hint));

      for (const token of wordTokens) {
        expect(hintTokens.has(token)).toBe(false);
      }
    }
  });

  it('deve retornar cópias defensivas em MemoryIbgeForcaDataSource.listForcaPuzzles()', async () => {
    const dataSource = new MemoryIbgeForcaDataSource();
    const firstCall = await dataSource.listForcaPuzzles();
    expect(firstCall).toHaveLength(IBGE_FORCA_PUZZLES.length);

    firstCall[0].word = 'ALTERADO';
    const secondCall = await dataSource.listForcaPuzzles();
    expect(secondCall[0].word).toBe(IBGE_FORCA_PUZZLES[0].word);
  });
});
