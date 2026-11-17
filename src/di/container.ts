import { AsyncStorageTeamDataSource } from '@/infra/datasources/asyncStorageTeamDataSource';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';
import { AdedonhaUseCases } from '@/usecase/adedonhaUseCases';
import type { IAdedonhaUseCases } from '@/usecase/iAdedonhaUseCases';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';

// Equipes e placar persistem no aparelho (RF04–RF06); MemoryTeamDataSource segue para testes.
const teamDataSource = new AsyncStorageTeamDataSource();
const gameCatalogDataSource = new MemoryGameCatalogDataSource();

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
).trim();

const multiplayerRoomService: IMultiplayerRoomService =
  supabaseUrl && supabaseAnonKey
    ? new SupabaseMultiplayerRoomService({
        supabaseUrl,
        supabaseAnonKey,
      })
    : new MemoryMultiplayerRoomService();

export const isSupabaseMultiplayerEnabled: boolean = Boolean(
  supabaseUrl && supabaseAnonKey
);

export const pgPlayUseCases: IPgPlayUseCases = new PgPlayUseCases(
  teamDataSource,
  gameCatalogDataSource
);

export const adedonhaUseCases: IAdedonhaUseCases = new AdedonhaUseCases(
  multiplayerRoomService
);
