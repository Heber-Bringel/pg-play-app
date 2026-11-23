import type { IThemePreferenceDataSource } from '@/model/datasources/iThemePreferenceDataSource';
import type { ThemePreference } from '@/model/entities/themePreference';

export class MemoryThemePreferenceDataSource
  implements IThemePreferenceDataSource
{
  private preference: ThemePreference;

  constructor(initialPreference: ThemePreference = 'auto') {
    this.preference = initialPreference;
  }

  async getThemePreference(): Promise<ThemePreference> {
    return this.preference;
  }

  async setThemePreference(preference: ThemePreference): Promise<void> {
    this.preference = preference;
  }
}
