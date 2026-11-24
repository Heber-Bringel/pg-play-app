import type {
  QuemSouEuCard,
  QuemSouEuPack,
} from '@/model/entities/quemSouEuCard';

export interface IQuemSouEuDataSource {
  listCards(packs?: QuemSouEuPack[]): Promise<QuemSouEuCard[]>;
}
