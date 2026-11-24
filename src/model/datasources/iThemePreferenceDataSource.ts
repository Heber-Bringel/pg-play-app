import type { ThemePreference } from '@/model/entities/themePreference';

export interface IThemePreferenceDataSource {
  getThemePreference(): Promise<ThemePreference>;
  setThemePreference(preference: ThemePreference): Promise<void>;
}
