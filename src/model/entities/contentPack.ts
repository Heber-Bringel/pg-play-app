import type {
  ForcaCategory,
  MimicaCategory,
  QuizCategory,
} from '@/model/entities/arenaChallenge';

export type ContentPackGameId = 'mimica' | 'quiz' | 'forca';

export type ContentPackCategory = MimicaCategory | QuizCategory | ForcaCategory;

export type ContentPack = {
  id: string;
  gameId: ContentPackGameId;
  category: ContentPackCategory;
  label: string;
  description: string;
  icon: string;
};
