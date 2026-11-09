import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

const teamDataSource = new MemoryTeamDataSource();
const gameCatalogDataSource = new MemoryGameCatalogDataSource();

export const pgPlayUseCases: IPgPlayUseCases = new PgPlayUseCases(
  teamDataSource,
  gameCatalogDataSource
);
