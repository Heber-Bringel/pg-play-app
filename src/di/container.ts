import { AsyncStorageTeamDataSource } from '@/infra/datasources/asyncStorageTeamDataSource';
import { AsyncStorageThemePreferenceDataSource } from '@/infra/datasources/asyncStorageThemePreferenceDataSource';
import { HelloAoVerseDataSource } from '@/infra/datasources/helloAoVerseDataSource';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryVerseDataSource } from '@/infra/datasources/memoryVerseDataSource';
import { ExpoSpeechNarratorAudioService } from '@/infra/services/expoSpeechNarratorAudioService';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';
import type { INarratorAudioService } from '@/model/services/iNarratorAudioService';
import { AdedonhaUseCases } from '@/usecase/adedonhaUseCases';
import { CidadeDormeUseCases } from '@/usecase/cidadeDormeUseCases';
import type { IAdedonhaUseCases } from '@/usecase/iAdedonhaUseCases';
import type { ICidadeDormeUseCases } from '@/usecase/iCidadeDormeUseCases';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import type { IThemePreferenceUseCases } from '@/usecase/iThemePreferenceUseCases';
import type { IVersiculoUseCases } from '@/usecase/iVersiculoUseCases';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import { ThemePreferenceUseCases } from '@/usecase/themePreferenceUseCases';
import { VersiculoUseCases } from '@/usecase/versiculoUseCases';

// Equipes e placar persistem no aparelho (RF04–RF06); MemoryTeamDataSource segue para testes.
const teamDataSource = new AsyncStorageTeamDataSource();
const themePreferenceDataSource = new AsyncStorageThemePreferenceDataSource();
const gameCatalogDataSource = new MemoryGameCatalogDataSource();
const verseDataSource = new HelloAoVerseDataSource(new MemoryVerseDataSource());
const narratorAudioService: INarratorAudioService =
  new ExpoSpeechNarratorAudioService();

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

export const cidadeDormeUseCases: ICidadeDormeUseCases =
  new CidadeDormeUseCases(multiplayerRoomService, narratorAudioService);

export const versiculoUseCases: IVersiculoUseCases = new VersiculoUseCases(
  verseDataSource,
  teamDataSource
);

export const themePreferenceUseCases: IThemePreferenceUseCases =
  new ThemePreferenceUseCases(themePreferenceDataSource);
