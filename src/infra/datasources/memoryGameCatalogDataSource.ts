import type { IGameCatalogDataSource } from '@/model/datasources/iGameCatalogDataSource';
import type { MimicaCard, MimicaCategory } from '@/model/entities/arenaChallenge';
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

export class MemoryGameCatalogDataSource implements IGameCatalogDataSource {
  private mimicaCards: MimicaCard[];

  constructor(initialCards: MimicaCard[] = DEFAULT_MIMICA_CARDS) {
    this.mimicaCards = initialCards.map((card) => ({ ...card }));
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
}
