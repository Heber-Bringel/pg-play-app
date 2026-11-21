import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IMatchSettingsDataSource } from '@/model/datasources/iMatchSettingsDataSource';
import {
  DEFAULT_MATCH_SETTINGS,
  type MatchSettings,
} from '@/model/entities/matchSettings';
import { DataSourceError } from '@/model/errors';

const MATCH_SETTINGS_STORAGE_KEY = '@pgplay:match_settings:v1';

function mergeWithDefaults(parsed: Partial<MatchSettings>): MatchSettings {
  return {
    mimica: {
      ...DEFAULT_MATCH_SETTINGS.mimica,
      ...(parsed.mimica ?? {}),
    },
    quiz: {
      ...DEFAULT_MATCH_SETTINGS.quiz,
      ...(parsed.quiz ?? {}),
    },
    forca: {
      ...DEFAULT_MATCH_SETTINGS.forca,
      ...(parsed.forca ?? {}),
    },
  };
}

export class AsyncStorageMatchSettingsDataSource
  implements IMatchSettingsDataSource
{
  async getSettings(): Promise<MatchSettings> {
    try {
      const raw = await AsyncStorage.getItem(MATCH_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return mergeWithDefaults({});
      }
      const parsed = JSON.parse(raw) as Partial<MatchSettings>;
      return mergeWithDefaults(parsed);
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os parâmetros da partida.'
      );
    }
  }

  async saveSettings(settings: MatchSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        MATCH_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar os parâmetros da partida.'
      );
    }
  }
}
