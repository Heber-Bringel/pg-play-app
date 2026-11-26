import type { ForcaPuzzle } from '@/model/entities/arenaChallenge';

export interface IIbgeForcaDataSource {
  listForcaPuzzles(): Promise<ForcaPuzzle[]>;
}
