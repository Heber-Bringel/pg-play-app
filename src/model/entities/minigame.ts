export type GameModality = '1 Celular' | 'Multi-Celular';

export type GameModalityFilter = 'Todos' | GameModality;

export type MinigameRoute =
  | '/mimica'
  | '/quiz'
  | '/forca'
  | '/adedonha'
  | '/cidade-dorme'
  | '/versiculo'
  | '/termometro';

export type MinigameIconName =
  | 'drama-masks'
  | 'lightning-bolt'
  | 'alphabetical-variant'
  | 'format-list-checks'
  | 'weather-night'
  | 'book-open-variant'
  | 'thermometer-lines';

export type Minigame = {
  id: string;
  title: string;
  description: string;
  modality: GameModality;
  playersTag: string;
  route: MinigameRoute;
  icon: MinigameIconName;
  themes: string[];
  available: boolean;
};
