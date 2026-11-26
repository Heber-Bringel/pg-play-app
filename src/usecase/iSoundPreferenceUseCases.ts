import type { SoundPreference } from '@/model/entities/soundPreference';

export interface ISoundPreferenceUseCases {
  getSoundPreference(): Promise<SoundPreference>;
  setSoundEnabled(enabled: boolean): Promise<SoundPreference>;
  toggleSoundEnabled(): Promise<SoundPreference>;
}
