import type { IVerseDataSource } from '@/model/datasources/iVerseDataSource';
import type {
  VerseBlank,
  VersePack,
  VersePassage,
} from '@/model/entities/versePassage';
import { DataSourceError } from '@/model/errors';

type ChapterPoolEntry = {
  pack: VersePack;
  bookId: string;
  chapter: number;
};

type HelloAoChapterContent = {
  type: string;
  number?: number;
  text?: string;
};

type HelloAoChapterResponse = {
  translation?: { name?: string };
  book?: { name?: string };
  chapter?: { content?: HelloAoChapterContent[] };
};

const HELLOAO_BASE_URL = 'https://bible.helloao.org/api/por_blj';

const CHAPTER_POOL: ChapterPoolEntry[] = [
  // Evangelhos
  { pack: 'Evangelhos', bookId: 'JHN', chapter: 3 },
  { pack: 'Evangelhos', bookId: 'JHN', chapter: 10 },
  { pack: 'Evangelhos', bookId: 'JHN', chapter: 14 },
  { pack: 'Evangelhos', bookId: 'JHN', chapter: 15 },
  { pack: 'Evangelhos', bookId: 'MAT', chapter: 5 },
  { pack: 'Evangelhos', bookId: 'MAT', chapter: 6 },
  { pack: 'Evangelhos', bookId: 'MAT', chapter: 7 },
  { pack: 'Evangelhos', bookId: 'MAT', chapter: 11 },
  { pack: 'Evangelhos', bookId: 'LUK', chapter: 15 },
  // Salmos e Provérbios
  { pack: 'Salmos e Provérbios', bookId: 'PSA', chapter: 23 },
  { pack: 'Salmos e Provérbios', bookId: 'PSA', chapter: 27 },
  { pack: 'Salmos e Provérbios', bookId: 'PSA', chapter: 46 },
  { pack: 'Salmos e Provérbios', bookId: 'PSA', chapter: 91 },
  { pack: 'Salmos e Provérbios', bookId: 'PSA', chapter: 100 },
  { pack: 'Salmos e Provérbios', bookId: 'PSA', chapter: 121 },
  { pack: 'Salmos e Provérbios', bookId: 'PRO', chapter: 3 },
  { pack: 'Salmos e Provérbios', bookId: 'PRO', chapter: 16 },
  // Cartas de Paulo
  { pack: 'Cartas de Paulo', bookId: 'ROM', chapter: 8 },
  { pack: 'Cartas de Paulo', bookId: 'ROM', chapter: 12 },
  { pack: 'Cartas de Paulo', bookId: '1CO', chapter: 13 },
  { pack: 'Cartas de Paulo', bookId: 'GAL', chapter: 5 },
  { pack: 'Cartas de Paulo', bookId: 'EPH', chapter: 2 },
  { pack: 'Cartas de Paulo', bookId: 'EPH', chapter: 6 },
  { pack: 'Cartas de Paulo', bookId: 'PHP', chapter: 4 },
  // Antigo Testamento
  { pack: 'Antigo Testamento', bookId: 'GEN', chapter: 1 },
  { pack: 'Antigo Testamento', bookId: 'JOS', chapter: 1 },
  { pack: 'Antigo Testamento', bookId: 'ISA', chapter: 40 },
  { pack: 'Antigo Testamento', bookId: 'ISA', chapter: 41 },
  { pack: 'Antigo Testamento', bookId: 'ISA', chapter: 53 },
  { pack: 'Antigo Testamento', bookId: 'JER', chapter: 29 },
  { pack: 'Antigo Testamento', bookId: 'MIC', chapter: 6 },
];

const STOPWORDS = new Set([
  'porque',
  'porquanto',
  'portanto',
  'quando',
  'quanto',
  'quais',
  'aquele',
  'aquela',
  'aqueles',
  'aquelas',
  'aquilo',
  'assim',
  'ainda',
  'tambem',
  'entao',
  'entre',
  'sobre',
  'desde',
  'diante',
  'contra',
  'todos',
  'todas',
  'toda',
  'todo',
  'muito',
  'muita',
  'muitos',
  'muitas',
  'pouco',
  'mesmo',
  'mesma',
  'outro',
  'outra',
  'outros',
  'outras',
  'nenhum',
  'nenhuma',
  'algum',
  'alguma',
  'vossos',
  'vossas',
  'vosso',
  'vossa',
  'nossos',
  'nossas',
  'nosso',
  'nossa',
  'meus',
  'minhas',
  'minha',
  'teus',
  'tuas',
  'seus',
  'suas',
  'disse',
  'falou',
  'estao',
  'estava',
  'foram',
  'serao',
  'senhor',
  'deus',
  'jesus',
  'cristo',
]);

function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FALLBACK_DISTRACTORS = [
  'misericórdia',
  'esperança',
  'salvação',
  'sabedoria',
  'justiça',
  'alegria',
  'fidelidade',
  'adoração',
  'obediência',
  'verdade',
  'caminho',
  'glória',
  'coração',
  'fortaleza',
  'promessa',
  'aliança',
  'santidade',
  'paciência',
];

function buildOptionsForBlank(
  answer: string,
  chapterWords: string[]
): string[] {
  const normalizedAnswer = normalizeWord(answer);
  const used = new Set<string>([normalizedAnswer]);
  const distractors: string[] = [];

  const pool = shuffleArray([...chapterWords, ...FALLBACK_DISTRACTORS]);
  for (const candidate of pool) {
    const norm = normalizeWord(candidate);
    if (used.has(norm) || candidate.length < 5) {
      continue;
    }
    used.add(norm);
    const formatted =
      answer.charAt(0) === answer.charAt(0).toUpperCase()
        ? candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase()
        : candidate.toLowerCase();
    distractors.push(formatted);
    if (distractors.length === 3) {
      break;
    }
  }

  return shuffleArray([answer, ...distractors]);
}

function buildDynamicVersePassage(
  entry: ChapterPoolEntry,
  verseNumber: number,
  rawText: string,
  bookName: string,
  translationName: string,
  chapterWords: string[]
): VersePassage | null {
  const cleanText = rawText.replace(/\s+/g, ' ').trim();
  if (cleanText.length < 35 || cleanText.length > 240) {
    return null;
  }

  const wordMatches = cleanText.match(/\p{L}{5,}/gu) ?? [];
  const uniqueCandidates: string[] = [];
  const seenNormalized = new Set<string>();

  for (const word of wordMatches) {
    const norm = normalizeWord(word);
    if (STOPWORDS.has(norm) || seenNormalized.has(norm)) {
      continue;
    }
    seenNormalized.add(norm);
    uniqueCandidates.push(word);
  }

  if (uniqueCandidates.length === 0) {
    return null;
  }

  const desiredBlanks = uniqueCandidates.length >= 2 && cleanText.length >= 65 ? 2 : 1;
  const chosenWords = shuffleArray(uniqueCandidates).slice(0, desiredBlanks);

  // Mantém a ordem de aparição no versículo para numerar (1) e (2) naturalmente.
  chosenWords.sort((a, b) => cleanText.indexOf(a) - cleanText.indexOf(b));

  let textWithBlanks = cleanText;
  const blanks: VerseBlank[] = [];

  for (let i = 0; i < chosenWords.length; i += 1) {
    const word = chosenWords[i];
    const index = i + 1;
    const regex = new RegExp(`(?<!\\p{L})${escapeRegExp(word)}(?!\\p{L})`, 'u');
    if (!regex.test(textWithBlanks)) {
      return null;
    }
    textWithBlanks = textWithBlanks.replace(regex, `______ (${index})`);
    blanks.push({
      index,
      answer: word,
      options: buildOptionsForBlank(word, chapterWords),
    });
  }

  return {
    id: `helloao-${entry.bookId.toLowerCase()}-${entry.chapter}-${verseNumber}`,
    pack: entry.pack,
    textWithBlanks,
    fullText: cleanText,
    blanks,
    reference: `${bookName} ${entry.chapter}:${verseNumber}`,
    translation: translationName,
  };
}

export class HelloAoVerseDataSource implements IVerseDataSource {
  private readonly chapterCache = new Map<string, HelloAoChapterResponse>();
  private readonly fallbackDataSource?: IVerseDataSource;

  constructor(fallbackDataSource?: IVerseDataSource) {
    this.fallbackDataSource = fallbackDataSource;
  }

  private async fetchChapter(
    bookId: string,
    chapter: number
  ): Promise<HelloAoChapterResponse> {
    const key = `${bookId}:${chapter}`;
    const cached = this.chapterCache.get(key);
    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${HELLOAO_BASE_URL}/${bookId}/${chapter}.simple.json`,
        { signal: controller.signal }
      );
      if (!response.ok) {
        throw new DataSourceError(
          `Falha ao consultar API da Bíblia (${response.status}).`
        );
      }
      const data = (await response.json()) as HelloAoChapterResponse;
      this.chapterCache.set(key, data);
      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async listPassages(packs?: VersePack[]): Promise<VersePassage[]> {
    if (packs && packs.length === 0) {
      return [];
    }

    const packSet = packs ? new Set<VersePack>(packs) : null;
    const matchingChapters = packSet
      ? CHAPTER_POOL.filter((entry) => packSet.has(entry.pack))
      : CHAPTER_POOL;

    // Sorteia até 2 capítulos por pacote a cada chamada para variar os versículos.
    const chaptersByPack = new Map<VersePack, ChapterPoolEntry[]>();
    for (const entry of matchingChapters) {
      const list = chaptersByPack.get(entry.pack) ?? [];
      list.push(entry);
      chaptersByPack.set(entry.pack, list);
    }

    const selectedChapters: ChapterPoolEntry[] = [];
    chaptersByPack.forEach((entries) => {
      selectedChapters.push(...shuffleArray(entries).slice(0, 2));
    });

    const dynamicPassages: VersePassage[] = [];

    await Promise.all(
      selectedChapters.map(async (entry) => {
        try {
          const chapterData = await this.fetchChapter(
            entry.bookId,
            entry.chapter
          );
          const bookName = chapterData.book?.name ?? entry.bookId;
          const translationName =
            chapterData.translation?.name ?? 'Bíblia Livre';
          const verses = (chapterData.chapter?.content ?? []).filter(
            (item): item is HelloAoChapterContent & { number: number; text: string } =>
              item.type === 'verse' &&
              typeof item.number === 'number' &&
              typeof item.text === 'string'
          );

          const chapterWords = verses.flatMap((v) =>
            (v.text.match(/\p{L}{5,}/gu) ?? []).filter(
              (w) => !STOPWORDS.has(normalizeWord(w))
            )
          );

          const sampledVerses = shuffleArray(verses).slice(0, 8);
          for (const verse of sampledVerses) {
            const built = buildDynamicVersePassage(
              entry,
              verse.number,
              verse.text,
              bookName,
              translationName,
              chapterWords
            );
            if (built) {
              dynamicPassages.push(built);
            }
          }
        } catch {
          // Falha de rede em capítulo individual cai para o fallback offline abaixo.
        }
      })
    );

    if (dynamicPassages.length > 0) {
      return shuffleArray(dynamicPassages);
    }

    if (this.fallbackDataSource) {
      return this.fallbackDataSource.listPassages(packs);
    }

    return [];
  }
}
