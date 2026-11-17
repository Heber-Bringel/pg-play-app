import { AsyncStorageTeamDataSource } from '@/infra/datasources/asyncStorageTeamDataSource';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { AdedonhaUseCases } from '@/usecase/adedonhaUseCases';
import type { IAdedonhaUseCases } from '@/usecase/iAdedonhaUseCases';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

// Equipes e placar persistem no aparelho (RF04–RF06); MemoryTeamDataSource segue para testes.
const teamDataSource = new AsyncStorageTeamDataSource();
const gameCatalogDataSource = new MemoryGameCatalogDataSource();
const multiplayerRoomService = new MemoryMultiplayerRoomService();

export const pgPlayUseCases: IPgPlayUseCases = new PgPlayUseCases(
  teamDataSource,
  gameCatalogDataSource
);

export const adedonhaUseCases: IAdedonhaUseCases = new AdedonhaUseCases(
  multiplayerRoomService
);
