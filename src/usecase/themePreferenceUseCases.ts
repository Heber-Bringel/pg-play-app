import type { IThemePreferenceDataSource } from '@/model/datasources/iThemePreferenceDataSource';
import type { ThemePreference } from '@/model/entities/themePreference';
import { ValidationError } from '@/model/errors';
import type { IThemePreferenceUseCases } from '@/usecase/iThemePreferenceUseCases';

const VALID_PREFERENCES: readonly ThemePreference[] = ['auto', 'light', 'dark'];

export class ThemePreferenceUseCases implements IThemePreferenceUseCases {
  constructor(
    private readonly themePreferenceDataSource: IThemePreferenceDataSource
  ) {}

  async getThemePreference(): Promise<ThemePreference> {
    const preference = await this.themePreferenceDataSource.getThemePreference();
    return VALID_PREFERENCES.includes(preference) ? preference : 'auto';
  }

  async setThemePreference(
    preference: ThemePreference
  ): Promise<ThemePreference> {
    if (!VALID_PREFERENCES.includes(preference)) {
      throw new ValidationError(
        'Preferência de tema inválida. Escolha Automático, Claro ou Escuro.'
      );
    }
    await this.themePreferenceDataSource.setThemePreference(preference);
    return preference;
  }
}
