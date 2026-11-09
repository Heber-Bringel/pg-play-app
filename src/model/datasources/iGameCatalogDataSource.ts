import type { MimicaCard, MimicaCategory } from '@/model/entities/arenaChallenge';

export interface IGameCatalogDataSource {
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
}
