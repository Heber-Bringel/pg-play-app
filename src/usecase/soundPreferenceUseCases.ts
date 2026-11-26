import type { ISoundPreferenceDataSource } from '@/model/datasources/iSoundPreferenceDataSource';
import {
  DEFAULT_SOUND_PREFERENCE,
  type SoundPreference,
} from '@/model/entities/soundPreference';
import { ValidationError } from '@/model/errors';
import type { ISoundPreferenceUseCases } from '@/usecase/iSoundPreferenceUseCases';

export class SoundPreferenceUseCases implements ISoundPreferenceUseCases {
  constructor(
    private readonly soundPreferenceDataSource: ISoundPreferenceDataSource
  ) {}

  async getSoundPreference(): Promise<SoundPreference> {
    const preference =
      await this.soundPreferenceDataSource.getSoundPreference();
    if (
      typeof preference === 'object' &&
      preference !== null &&
      typeof preference.enabled === 'boolean'
    ) {
      return { enabled: preference.enabled };
    }
    return { ...DEFAULT_SOUND_PREFERENCE };
  }

  async setSoundEnabled(enabled: boolean): Promise<SoundPreference> {
    if (typeof enabled !== 'boolean') {
      throw new ValidationError(
        'Preferência de som inválida. Informe verdadeiro ou falso.'
      );
    }
    const next: SoundPreference = { enabled };
    await this.soundPreferenceDataSource.setSoundPreference(next);
    return next;
  }

  async toggleSoundEnabled(): Promise<SoundPreference> {
    const current = await this.getSoundPreference();
    return this.setSoundEnabled(!current.enabled);
  }
}
