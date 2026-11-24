import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IMatchSettingsDataSource } from '@/model/datasources/iMatchSettingsDataSource';
import {
  DEFAULT_MATCH_SETTINGS,
  type MatchSettings,
} from '@/model/entities/matchSettings';
import { DataSourceError } from '@/model/errors';

const MATCH_SETTINGS_STORAGE_KEY = '@pgplay:match_settings:v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Seções ausentes ou que não são objetos voltam ao padrão; os valores de cada
// campo são saneados depois pelo PgPlayUseCases.
function mergeWithDefaults(parsed: unknown): MatchSettings {
  const source = isRecord(parsed) ? parsed : {};
  const section = (key: keyof MatchSettings): Record<string, unknown> => {
    const value = source[key];
    return isRecord(value) ? value : {};
  };
  return {
    mimica: { ...DEFAULT_MATCH_SETTINGS.mimica, ...section('mimica') },
    quiz: { ...DEFAULT_MATCH_SETTINGS.quiz, ...section('quiz') },
    forca: { ...DEFAULT_MATCH_SETTINGS.forca, ...section('forca') },
  };
}

// JSON corrompido não pode impedir a abertura dos jogos: volta ao padrão.
function parseStoredSettings(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class AsyncStorageMatchSettingsDataSource
  implements IMatchSettingsDataSource
{
  async getSettings(): Promise<MatchSettings> {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(MATCH_SETTINGS_STORAGE_KEY);
    } catch {
      throw new DataSourceError(
        'Não foi possível carregar os parâmetros da partida.'
      );
    }
    return mergeWithDefaults(raw ? parseStoredSettings(raw) : null);
  }

  async saveSettings(settings: MatchSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        MATCH_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch {
      throw new DataSourceError(
        'Não foi possível salvar os parâmetros da partida.'
      );
    }
  }
}
