import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
} from '@/model/entities/arenaChallenge';

export interface IGameCatalogDataSource {
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
  listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>;
}
