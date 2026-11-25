import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ISoundPreferenceDataSource } from '@/model/datasources/iSoundPreferenceDataSource';
import {
  DEFAULT_SOUND_PREFERENCE,
  type SoundPreference,
} from '@/model/entities/soundPreference';
import { DataSourceError } from '@/model/errors';

const SOUND_PREFERENCE_STORAGE_KEY = '@pgplay:sound-preference:v1';

function parseStoredSoundPreference(raw: string | null): SoundPreference {
  if (!raw) {
    return { ...DEFAULT_SOUND_PREFERENCE };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      typeof (parsed as Record<string, unknown>).enabled === 'boolean'
    ) {
      return { enabled: (parsed as { enabled: boolean }).enabled };
    }
    return { ...DEFAULT_SOUND_PREFERENCE };
  } catch {
    return { ...DEFAULT_SOUND_PREFERENCE };
  }
}

export class AsyncStorageSoundPreferenceDataSource
  implements ISoundPreferenceDataSource
{
  async getSoundPreference(): Promise<SoundPreference> {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(SOUND_PREFERENCE_STORAGE_KEY);
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar a preferência de som do armazenamento.'
      );
    }
    return parseStoredSoundPreference(raw);
  }

  async setSoundPreference(preference: SoundPreference): Promise<void> {
    try {
      await AsyncStorage.setItem(
        SOUND_PREFERENCE_STORAGE_KEY,
        JSON.stringify({ enabled: Boolean(preference.enabled) })
      );
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a preferência de som no armazenamento.'
      );
    }
  }
}
