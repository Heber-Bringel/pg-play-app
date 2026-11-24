import type { ThemePreference } from '@/model/entities/themePreference';

export interface IThemePreferenceUseCases {
  getThemePreference(): Promise<ThemePreference>;
  setThemePreference(preference: ThemePreference): Promise<ThemePreference>;
}
