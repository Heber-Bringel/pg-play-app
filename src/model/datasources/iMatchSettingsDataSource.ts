import type { MatchSettings } from '@/model/entities/matchSettings';

export interface IMatchSettingsDataSource {
  getSettings(): Promise<MatchSettings>;
  saveSettings(settings: MatchSettings): Promise<void>;
}
