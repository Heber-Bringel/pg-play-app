import type { IMatchSettingsDataSource } from '@/model/datasources/iMatchSettingsDataSource';
import {
  DEFAULT_MATCH_SETTINGS,
  type MatchSettings,
} from '@/model/entities/matchSettings';

function cloneSettings(settings: MatchSettings): MatchSettings {
  return {
    mimica: { ...settings.mimica },
    quiz: { ...settings.quiz },
    forca: { ...settings.forca },
    desenho: { ...settings.desenho },
  };
}

export class MemoryMatchSettingsDataSource implements IMatchSettingsDataSource {
  private settings: MatchSettings;

  constructor(initialSettings: MatchSettings = DEFAULT_MATCH_SETTINGS) {
    this.settings = cloneSettings(initialSettings);
  }

  async getSettings(): Promise<MatchSettings> {
    return cloneSettings(this.settings);
  }

  async saveSettings(settings: MatchSettings): Promise<void> {
    this.settings = cloneSettings(settings);
  }
}
