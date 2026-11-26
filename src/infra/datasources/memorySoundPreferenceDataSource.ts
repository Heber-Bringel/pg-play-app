import type { ISoundPreferenceDataSource } from '@/model/datasources/iSoundPreferenceDataSource';
import {
  DEFAULT_SOUND_PREFERENCE,
  type SoundPreference,
} from '@/model/entities/soundPreference';

export class MemorySoundPreferenceDataSource
  implements ISoundPreferenceDataSource
{
  private preference: SoundPreference;

  constructor(
    initialPreference: SoundPreference = DEFAULT_SOUND_PREFERENCE
  ) {
    this.preference = { ...initialPreference };
  }

  async getSoundPreference(): Promise<SoundPreference> {
    return { ...this.preference };
  }

  async setSoundPreference(preference: SoundPreference): Promise<void> {
    this.preference = { ...preference };
  }
}
