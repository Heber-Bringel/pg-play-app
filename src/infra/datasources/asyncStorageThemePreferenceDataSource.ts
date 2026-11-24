import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IThemePreferenceDataSource } from '@/model/datasources/iThemePreferenceDataSource';
import type { ThemePreference } from '@/model/entities/themePreference';
import { DataSourceError } from '@/model/errors';

const THEME_PREFERENCE_STORAGE_KEY = '@pgplay:theme-preference:v1';

function isValidThemePreference(value: unknown): value is ThemePreference {
  return value === 'auto' || value === 'light' || value === 'dark';
}

export class AsyncStorageThemePreferenceDataSource
  implements IThemePreferenceDataSource
{
  async getThemePreference(): Promise<ThemePreference> {
    try {
      const raw = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
      if (isValidThemePreference(raw)) {
        return raw;
      }
      return 'auto';
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar a preferência de tema do armazenamento.'
      );
    }
  }

  async setThemePreference(preference: ThemePreference): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a preferência de tema no armazenamento.'
      );
    }
  }
}
