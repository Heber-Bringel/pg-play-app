import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
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
    word: 'PINGUIM',
    hint: 'Ave marinha que não voa e vive em regiões frias',
    category: 'Animais',
  },
  {
    id: 'forca-7',
    word: 'JERUSALÉM',
    hint: 'Cidade histórica sagrada e milenar',
    category: 'Países e Cidades',
  },
  {
    id: 'forca-8',
    word: 'BRASÍLIA',
    hint: 'Capital do Brasil projetada no formato de avião',
    category: 'Países e Cidades',
  },
  {
    id: 'forca-9',
    word: 'MELANCIA',
    hint: 'Fruta grande de polpa vermelha com muitas sementes',
    category: 'Frutas e Comidas',
  },
  {
    id: 'forca-10',
    word: 'INTERESTELAR',
    hint: 'Filme de ficção científica sobre viagens espaciais',
    category: 'Filmes',
  },
  {
    id: 'forca-11',
    word: 'ARQUITETO',
    hint: 'Profissional responsável por projetar edifícios',
    category: 'Profissões',
  },
  {
    id: 'forca-12',
    word: 'BASQUETEBOL',
    hint: 'Esporte disputado com cesta elevada e bola laranja',
    category: 'Esportes',
  },
];

export class MemoryGameCatalogDataSource implements IGameCatalogDataSource {
  private mimicaCards: MimicaCard[];
  private forcaPuzzles: ForcaPuzzle[];

  constructor(
    initialCards: MimicaCard[] = DEFAULT_MIMICA_CARDS,
    initialPuzzles: ForcaPuzzle[] = DEFAULT_FORCA_PUZZLES
  ) {
    this.mimicaCards = initialCards.map((card) => ({ ...card }));
    this.forcaPuzzles = initialPuzzles.map((puzzle) => ({ ...puzzle }));
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
}
