import { MemoryThemePreferenceDataSource } from '@/infra/datasources/memoryThemePreferenceDataSource';
import type { IThemePreferenceDataSource } from '@/model/datasources/iThemePreferenceDataSource';
import type { ThemePreference } from '@/model/entities/themePreference';
import { ValidationError } from '@/model/errors';
import { ThemePreferenceUseCases } from '@/usecase/themePreferenceUseCases';

describe('ThemePreferenceUseCases', () => {
  it('retorna auto por padrão e persiste light, dark e auto corretamente', async () => {
    const dataSource = new MemoryThemePreferenceDataSource();
    const useCases = new ThemePreferenceUseCases(dataSource);

    expect(await useCases.getThemePreference()).toBe('auto');

    expect(await useCases.setThemePreference('dark')).toBe('dark');
    expect(await useCases.getThemePreference()).toBe('dark');

    expect(await useCases.setThemePreference('light')).toBe('light');
    expect(await useCases.getThemePreference()).toBe('light');

    expect(await useCases.setThemePreference('auto')).toBe('auto');
    expect(await useCases.getThemePreference()).toBe('auto');
  });

  it('faz fallback para auto quando o datasource retorna valor inválido', async () => {
    const brokenDataSource: IThemePreferenceDataSource = {
      getThemePreference: async () => 'sepia' as ThemePreference,
      setThemePreference: async () => {},
    };
    const useCases = new ThemePreferenceUseCases(brokenDataSource);

    expect(await useCases.getThemePreference()).toBe('auto');
  });

  it('lança ValidationError ao tentar salvar uma preferência inválida', async () => {
    const useCases = new ThemePreferenceUseCases(
      new MemoryThemePreferenceDataSource()
    );

    await expect(
      useCases.setThemePreference('sepia' as ThemePreference)
    ).rejects.toThrow(ValidationError);
  });
});
