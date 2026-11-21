import type { IVerseDataSource } from '@/model/datasources/iVerseDataSource';
import type { VersePack, VersePassage } from '@/model/entities/versePassage';
import { DataSourceError } from '@/model/errors';

const DEFAULT_PASSAGES: VersePassage[] = [
  // Evangelhos
  {
    id: 'verse-jhn-3-16',
    pack: 'Evangelhos',
    textWithBlanks:
      'Porque Deus amou ao mundo de tal maneira, que deu o seu Filho ______ (1); para que todo aquele que nele crê não ______ (2), mas tenha a vida eterna.',
    fullText:
      'Porque Deus amou ao mundo de tal maneira, que deu o seu Filho unigênito; para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    blanks: [
      {
        index: 1,
        answer: 'unigênito',
        options: ['unigênito', 'primogênito', 'escolhido', 'amado'],
      },
      {
        index: 2,
        answer: 'pereça',
        options: ['tropece', 'pereça', 'duvide', 'desista'],
      },
    ],
    reference: 'João 3:16',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-jhn-14-6',
    pack: 'Evangelhos',
    textWithBlanks:
      'Disse-lhe Jesus: Eu sou o ______ (1), e a ______ (2), e a vida; ninguém vem ao Pai, senão por mim.',
    fullText:
      'Disse-lhe Jesus: Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai, senão por mim.',
    blanks: [
      {
        index: 1,
        answer: 'caminho',
        options: ['abrigo', 'caminho', 'templo', 'farol'],
      },
      {
        index: 2,
        answer: 'verdade',
        options: ['justiça', 'esperança', 'verdade', 'promessa'],
      },
    ],
    reference: 'João 14:6',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-mat-11-28',
    pack: 'Evangelhos',
    textWithBlanks:
      'Vinde a mim, todos os que estais ______ (1) e oprimidos, e eu vos ______ (2).',
    fullText:
      'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.',
    blanks: [
      {
        index: 1,
        answer: 'cansados',
        options: ['perdidos', 'cansados', 'aflitos', 'temerosos'],
      },
      {
        index: 2,
        answer: 'aliviarei',
        options: ['guiarei', 'guardarei', 'aliviarei', 'perdoarei'],
      },
    ],
    reference: 'Mateus 11:28',
    translation: 'Bíblia Livre',
  },
  // Salmos e Provérbios
  {
    id: 'verse-psa-23-1',
    pack: 'Salmos e Provérbios',
    textWithBlanks:
      'O SENHOR é o meu ______ (1), nada me ______ (2).',
    fullText: 'O SENHOR é o meu pastor, nada me faltará.',
    blanks: [
      {
        index: 1,
        answer: 'pastor',
        options: ['escudo', 'pastor', 'refúgio', 'mestre'],
      },
      {
        index: 2,
        answer: 'faltará',
        options: ['abalará', 'deterá', 'faltará', 'assustará'],
      },
    ],
    reference: 'Salmos 23:1',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-psa-119-105',
    pack: 'Salmos e Provérbios',
    textWithBlanks:
      '______ (1) para os meus pés é tua palavra, e ______ (2) para o meu caminho.',
    fullText:
      'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.',
    blanks: [
      {
        index: 1,
        answer: 'Lâmpada',
        options: ['Lâmpada', 'Bússola', 'Rocha', 'Fonte'],
      },
      {
        index: 2,
        answer: 'luz',
        options: ['paz', 'luz', 'força', 'vida'],
      },
    ],
    reference: 'Salmos 119:105',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-pro-3-5',
    pack: 'Salmos e Provérbios',
    textWithBlanks:
      'Confia no SENHOR de todo o teu ______ (1), e não te estribes no teu próprio ______ (2).',
    fullText:
      'Confia no SENHOR de todo o teu coração, e não te estribes no teu próprio entendimento.',
    blanks: [
      {
        index: 1,
        answer: 'coração',
        options: ['espírito', 'coração', 'esforço', 'pensamento'],
      },
      {
        index: 2,
        answer: 'entendimento',
        options: ['conhecimento', 'julgamento', 'entendimento', 'planejamento'],
      },
    ],
    reference: 'Provérbios 3:5',
    translation: 'Bíblia Livre',
  },
  // Cartas de Paulo
  {
    id: 'verse-php-4-13',
    pack: 'Cartas de Paulo',
    textWithBlanks: 'Tudo posso naquele que me ______ (1).',
    fullText: 'Tudo posso naquele que me fortalece.',
    blanks: [
      {
        index: 1,
        answer: 'fortalece',
        options: ['sustenta', 'fortalece', 'ilumina', 'acompanha'],
      },
    ],
    reference: 'Filipenses 4:13',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-rom-8-28',
    pack: 'Cartas de Paulo',
    textWithBlanks:
      'E sabemos que todas as coisas contribuem juntamente para o ______ (1) daqueles que ______ (2) a Deus.',
    fullText:
      'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.',
    blanks: [
      {
        index: 1,
        answer: 'bem',
        options: ['louvor', 'bem', 'cuidado', 'propósito'],
      },
      {
        index: 2,
        answer: 'amam',
        options: ['buscam', 'servem', 'amam', 'temem'],
      },
    ],
    reference: 'Romanos 8:28',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-eph-2-8',
    pack: 'Cartas de Paulo',
    textWithBlanks:
      'Porque pela ______ (1) sois salvos, por meio da ______ (2); e isto não vem de vós, é dom de Deus.',
    fullText:
      'Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.',
    blanks: [
      {
        index: 1,
        answer: 'graça',
        options: ['misericórdia', 'graça', 'promessa', 'aliança'],
      },
      {
        index: 2,
        answer: 'fé',
        options: ['esperança', 'oração', 'fé', 'caridade'],
      },
    ],
    reference: 'Efésios 2:8',
    translation: 'Bíblia Livre',
  },
  // Antigo Testamento
  {
    id: 'verse-jos-1-9',
    pack: 'Antigo Testamento',
    textWithBlanks:
      'Não to mandei eu? Esforça-te, e tem bom ______ (1); não temas, nem te ______ (2), porque o SENHOR teu Deus é contigo.',
    fullText:
      'Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes, porque o SENHOR teu Deus é contigo.',
    blanks: [
      {
        index: 1,
        answer: 'ânimo',
        options: ['ânimo', 'conselho', 'coração', 'entendimento'],
      },
      {
        index: 2,
        answer: 'espantes',
        options: ['desanimes', 'espantes', 'afastes', 'entristeças'],
      },
    ],
    reference: 'Josué 1:9',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-isa-41-10',
    pack: 'Antigo Testamento',
    textWithBlanks:
      'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te ______ (1), e te ______ (2).',
    fullText:
      'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo.',
    blanks: [
      {
        index: 1,
        answer: 'fortaleço',
        options: ['fortaleço', 'guardo', 'ensino', 'conduzo'],
      },
      {
        index: 2,
        answer: 'ajudo',
        options: ['sustento', 'ajudo', 'protejo', 'renovo'],
      },
    ],
    reference: 'Isaías 41:10',
    translation: 'Bíblia Livre',
  },
  {
    id: 'verse-jer-29-11',
    pack: 'Antigo Testamento',
    textWithBlanks:
      'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de ______ (1), e não de mal, para vos dar o ______ (2) que esperais.',
    fullText:
      'Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o SENHOR; pensamentos de paz, e não de mal, para vos dar o fim que esperais.',
    blanks: [
      {
        index: 1,
        answer: 'paz',
        options: ['alegria', 'paz', 'vitória', 'esperança'],
      },
      {
        index: 2,
        answer: 'fim',
        options: ['fruto', 'fim', 'descanso', 'futuro'],
      },
    ],
    reference: 'Jeremias 29:11',
    translation: 'Bíblia Livre',
  },
];

export class MemoryVerseDataSource implements IVerseDataSource {
  private readonly passages: VersePassage[];

  constructor(initialPassages: VersePassage[] = DEFAULT_PASSAGES) {
    this.passages = initialPassages.map((passage) => ({
      ...passage,
      blanks: passage.blanks.map((blank) => ({
        ...blank,
        options: [...blank.options],
      })),
    }));
  }

  async listPassages(packs?: VersePack[]): Promise<VersePassage[]> {
    if (!packs) {
      return this.passages.map((passage) => ({
        ...passage,
        blanks: passage.blanks.map((blank) => ({
          ...blank,
          options: [...blank.options],
        })),
      }));
    }

    if (packs.length === 0) {
      return [];
    }

    try {
      const packSet = new Set<VersePack>(packs);
      return this.passages
        .filter((passage) => packSet.has(passage.pack))
        .map((passage) => ({
          ...passage,
          blanks: passage.blanks.map((blank) => ({
            ...blank,
            options: [...blank.options],
          })),
        }));
    } catch {
      throw new DataSourceError('Erro ao carregar passagens bíblicas em memória.');
    }
  }
}
