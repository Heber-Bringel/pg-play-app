import type { SoundPreference } from '@/model/entities/soundPreference';

export interface ISoundPreferenceDataSource {
  getSoundPreference(): Promise<SoundPreference>;
  setSoundPreference(preference: SoundPreference): Promise<void>;
}
