import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';
import { DataSourceError } from '@/model/errors';

const DEFAULT_MIMICA_CARDS: MimicaCard[] = [
  { id: 'mimica-1', word: 'Davi e Golias', category: 'Bíblico', points: 20 },
  { id: 'mimica-2', word: 'Arca de Noé', category: 'Bíblico', points: 20 },
  { id: 'mimica-3', word: 'Jonas e a Baleia', category: 'Bíblico', points: 20 },
  { id: 'mimica-4', word: 'Travessia do Mar Vermelho', category: 'Bíblico', points: 20 },
  { id: 'mimica-5', word: 'Rei Leão', category: 'Filmes e Séries', points: 20 },
  { id: 'mimica-6', word: 'Homem-Aranha', category: 'Filmes e Séries', points: 20 },
  { id: 'mimica-7', word: 'Canguru Saltando', category: 'Animais', points: 20 },
  { id: 'mimica-8', word: 'Pinguim no Gelo', category: 'Animais', points: 20 },
  { id: 'mimica-9', word: 'Bombeiro Apagando Incêndio', category: 'Profissões', points: 20 },
  { id: 'mimica-10', word: 'Maestro de Orquestra', category: 'Profissões', points: 20 },
  { id: 'mimica-11', word: 'Cobrança de Pênalti', category: 'Esportes', points: 20 },
  { id: 'mimica-12', word: 'Surfando Onda Gigante', category: 'Esportes', points: 20 },
  { id: 'mimica-13', word: 'Escovando os Dentes com Pressa', category: 'Ações do Dia a Dia', points: 20 },
  { id: 'mimica-14', word: 'Procurando Chave Perdida', category: 'Ações do Dia a Dia', points: 20 },
  { id: 'mimica-15', word: 'Tirando Selfie em Grupo', category: 'Cultura Pop', points: 20 },
];

const DEFAULT_FORCA_PUZZLES: ForcaPuzzle[] = [
  {
    id: 'forca-1',
    word: 'COMUNHÃO',
    hint: 'Propósito essencial de um Pequeno Grupo (PG)',
    category: 'Bíblico',
  },
  {
    id: 'forca-2',
    word: 'ESTER',
    hint: 'Rainha corajosa que intercedeu pelo povo',
    category: 'Bíblico',
  },
  {
    id: 'forca-3',
    word: 'SALMOS',
    hint: 'Livro poético repleto de orações e louvores',
    category: 'Bíblico',
  },
  {
    id: 'forca-4',
    word: 'PENTECOSTES',
    hint: 'Festa onde houve a descida do Espírito Santo',
    category: 'Bíblico',
  },
  {
    id: 'forca-5',
    word: 'GIRAFA',
    hint: 'Mamífero terrestre mais alto do mundo',
    category: 'Animais',
  },
  {
    id: 'forca-6',
    word: 'PORTUGAL',
    hint: 'País europeu de onde partiu Pedro Álvares Cabral',
    category: 'Países e Cidades',
  },
  {
    id: 'forca-7',
    word: 'MELANCIA',
    hint: 'Fruta grande, doce e cheia de água',
    category: 'Frutas e Comidas',
  },
  {
    id: 'forca-8',
    word: 'MATARIX',
    hint: 'Filme onde Neo escolhe entre a pílula azul e vermelha',
    category: 'Filmes',
  },
  {
    id: 'forca-9',
    word: 'ENFERMEIRO',
    hint: 'Profissional dedicado ao cuidado dos enfermos',
    category: 'Profissões',
  },
  {
    id: 'forca-10',
    word: 'BASQUETE',
    hint: 'Esporte disputado com cesta e bola laranja',
    category: 'Esportes',
  },
];

const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'Quem construiu a arca sob instrução de Deus para salvar sua família?',
    category: 'Bíblico',
    correctKey: 'B',
    explanation: 'Noé construiu a arca conforme narrado no livro de Gênesis (capítulo 6).',
    options: [
      { key: 'A', text: 'Moisés' },
      { key: 'B', text: 'Noé' },
      { key: 'C', text: 'Abraão' },
      { key: 'D', text: 'Davi' },
    ],
  },
  {
    id: 'quiz-2',
    question: 'Quantos discípulos mais próximos acompanhavam o ministério de Jesus?',
    category: 'Bíblico',
    correctKey: 'C',
    explanation: 'Jesus chamou 12 apóstolos para segui-lo de perto (Mateus 10:1-4).',
    options: [
      { key: 'A', text: '7 discípulos' },
      { key: 'B', text: '10 discípulos' },
      { key: 'C', text: '12 discípulos' },
      { key: 'D', text: '14 discípulos' },
    ],
  },
  {
    id: 'quiz-3',
    question: 'Qual livro da Bíblia possui o maior número de capítulos (150 no total)?',
    category: 'Bíblico',
    correctKey: 'C',
    explanation: 'O livro de Salmos é o maior da Bíblia, reunindo orações, cânticos e louvores.',
    options: [
      { key: 'A', text: 'Gênesis' },
      { key: 'B', text: 'Isaías' },
      { key: 'C', text: 'Salmos' },
      { key: 'D', text: 'Apocalipse' },
    ],
  },
  {
    id: 'quiz-4',
    question: 'Qual é o maior planeta do nosso Sistema Solar?',
    category: 'Ciência',
    correctKey: 'B',
    explanation: 'Júpiter é o maior planeta, com massa superior a todos os outros planetas juntos.',
    options: [
      { key: 'A', text: 'Saturno' },
      { key: 'B', text: 'Júpiter' },
      { key: 'C', text: 'Marte' },
      { key: 'D', text: 'Netuno' },
    ],
  },
  {
    id: 'quiz-5',
    question: 'Qual elemento químico é representado pela letra O na Tabela Periódica?',
    category: 'Ciência',
    correctKey: 'B',
    explanation: 'O oxigênio tem número atômico 8 e símbolo químico O.',
    options: [
      { key: 'A', text: 'Ouro' },
      { key: 'B', text: 'Oxigênio' },
      { key: 'C', text: 'Ósmio' },
      { key: 'D', text: 'Prata' },
    ],
  },
  {
    id: 'quiz-6',
    question: 'Qual é o país com maior extensão territorial do planeta?',
    category: 'Geografia',
    correctKey: 'C',
    explanation: 'A Rússia possui mais de 17 milhões de quilômetros quadrados de território.',
    options: [
      { key: 'A', text: 'Canadá' },
      { key: 'B', text: 'China' },
      { key: 'C', text: 'Rússia' },
      { key: 'D', text: 'Brasil' },
    ],
  },
  {
    id: 'quiz-7',
    question: 'Em qual continente se localiza o Deserto do Saara?',
    category: 'Geografia',
    correctKey: 'B',
    explanation: 'O Saara estende-se por grande parte do norte do continente africano.',
    options: [
      { key: 'A', text: 'Ásia' },
      { key: 'B', text: 'África' },
      { key: 'C', text: 'Oceania' },
      { key: 'D', text: 'Europa' },
    ],
  },
  {
    id: 'quiz-8',
    question: 'Em que ano a missão Apollo 11 pousou o homem na Lua pela primeira vez?',
    category: 'História',
    correctKey: 'B',
    explanation: 'Neil Armstrong e Buzz Aldrin pisaram na Lua em 20 de julho de 1969.',
    options: [
      { key: 'A', text: '1965' },
      { key: 'B', text: '1969' },
      { key: 'C', text: '1972' },
      { key: 'D', text: '1959' },
    ],
  },
  {
    id: 'quiz-9',
    question: 'Quem proclamou a Independência do Brasil às margens do Ipiranga em 1822?',
    category: 'História',
    correctKey: 'A',
    explanation: 'Dom Pedro I declarou a separação de Portugal em 7 de setembro de 1822.',
    options: [
      { key: 'A', text: 'Dom Pedro I' },
      { key: 'B', text: 'Tiradentes' },
      { key: 'C', text: 'Marechal Deodoro' },
      { key: 'D', text: 'Dom João VI' },
    ],
  },
  {
    id: 'quiz-10',
    question: 'Quantas cores compõem o arco-íris na física óptica tradicional?',
    category: 'Conhecimentos Gerais',
    correctKey: 'C',
    explanation: 'As 7 cores são: vermelho, laranja, amarelo, verde, azul, anil e violeta.',
    options: [
      { key: 'A', text: '5 cores' },
      { key: 'B', text: '6 cores' },
      { key: 'C', text: '7 cores' },
      { key: 'D', text: '8 cores' },
    ],
  },
  {
    id: 'quiz-11',
    question: 'Quantos minutos dura o tempo regulamentar de uma partida de futebol?',
    category: 'Esportes',
    correctKey: 'B',
    explanation: 'Uma partida oficial tem 90 minutos, divididos em dois tempos de 45 minutos.',
    options: [
      { key: 'A', text: '80 minutos' },
      { key: 'B', text: '90 minutos' },
      { key: 'C', text: '100 minutos' },
      { key: 'D', text: '120 minutos' },
    ],
  },
  {
    id: 'quiz-12',
    question: 'Quantas teclas tem um piano moderno de tamanho padrão?',
    category: 'Música e Cinema',
    correctKey: 'C',
    explanation: 'O piano tradicional possui 88 teclas no total (52 brancas e 36 pretas).',
    options: [
      { key: 'A', text: '76 teclas' },
      { key: 'B', text: '82 teclas' },
      { key: 'C', text: '88 teclas' },
      { key: 'D', text: '96 teclas' },
    ],
  },
];

export class MemoryGameCatalogDataSource implements IGameCatalogDataSource {
  private mimicaCards: MimicaCard[];
  private forcaPuzzles: ForcaPuzzle[];
  private quizQuestions: QuizQuestion[];

  constructor(
    initialCards: MimicaCard[] = DEFAULT_MIMICA_CARDS,
    initialPuzzles: ForcaPuzzle[] = DEFAULT_FORCA_PUZZLES,
    initialQuestions: QuizQuestion[] = DEFAULT_QUIZ_QUESTIONS
  ) {
    this.mimicaCards = initialCards.map((card) => ({ ...card }));
    this.forcaPuzzles = initialPuzzles.map((puzzle) => ({ ...puzzle }));
    this.quizQuestions = initialQuestions.map((q) => ({
      ...q,
      options: q.options.map((opt) => ({ ...opt })),
    }));
  }

  async listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]> {
    try {
      if (!categories || categories.length === 0) {
        return this.mimicaCards.map((card) => ({ ...card }));
      }
      const allowed = new Set(categories);
      return this.mimicaCards
        .filter((card) => allowed.has(card.category))
        .map((card) => ({ ...card }));
    } catch {
      throw new DataSourceError('Não foi possível carregar o banco de palavras da Mímica.');
    }
  }

  async listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]> {
    try {
      if (!categories || categories.length === 0) {
        return this.forcaPuzzles.map((puzzle) => ({ ...puzzle }));
      }
      const allowed = new Set(categories);
      return this.forcaPuzzles
        .filter((puzzle) => allowed.has(puzzle.category))
        .map((puzzle) => ({ ...puzzle }));
    } catch {
      throw new DataSourceError('Não foi possível carregar o banco de palavras do Jogo da Forca.');
    }
  }

  async listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]> {
    try {
      if (!categories || categories.length === 0) {
        return this.quizQuestions.map((q) => ({
          ...q,
          options: q.options.map((opt) => ({ ...opt })),
        }));
      }
      const allowed = new Set(categories);
      return this.quizQuestions
        .filter((q) => allowed.has(q.category))
        .map((q) => ({
          ...q,
          options: q.options.map((opt) => ({ ...opt })),
        }));
    } catch {
      throw new DataSourceError('Não foi possível carregar o banco de perguntas do Quiz.');
    }
  }
}
