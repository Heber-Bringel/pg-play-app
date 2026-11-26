import { MemorySoundPreferenceDataSource } from '@/infra/datasources/memorySoundPreferenceDataSource';
import type { ISoundPreferenceDataSource } from '@/model/datasources/iSoundPreferenceDataSource';
import type { SoundPreference } from '@/model/entities/soundPreference';
import { ValidationError } from '@/model/errors';
import { SoundPreferenceUseCases } from '@/usecase/soundPreferenceUseCases';

describe('SoundPreferenceUseCases (#84)', () => {
  it('inicia com som ligado (enabled: true) por padrão e permite alternar e persistir', async () => {
    const dataSource = new MemorySoundPreferenceDataSource();
    const useCases = new SoundPreferenceUseCases(dataSource);

    expect(await useCases.getSoundPreference()).toEqual({ enabled: true });

    expect(await useCases.setSoundEnabled(false)).toEqual({ enabled: false });
    expect(await useCases.getSoundPreference()).toEqual({ enabled: false });

    expect(await useCases.toggleSoundEnabled()).toEqual({ enabled: true });
    expect(await useCases.getSoundPreference()).toEqual({ enabled: true });

    expect(await useCases.toggleSoundEnabled()).toEqual({ enabled: false });
    expect(await useCases.getSoundPreference()).toEqual({ enabled: false });
  });

  it('faz fallback para enabled: true quando o datasource retorna valor inválido', async () => {
    const brokenDataSource: ISoundPreferenceDataSource = {
      getSoundPreference: async () =>
        ({ enabled: 'invalido' } as unknown as SoundPreference),
      setSoundPreference: async () => {},
    };
    const useCases = new SoundPreferenceUseCases(brokenDataSource);

    expect(await useCases.getSoundPreference()).toEqual({ enabled: true });
  });

  it('lança ValidationError quando o valor informado não é booleano', async () => {
    const useCases = new SoundPreferenceUseCases(
      new MemorySoundPreferenceDataSource()
    );

    await expect(
      useCases.setSoundEnabled('sim' as unknown as boolean)
    ).rejects.toThrow(ValidationError);
  });
});
