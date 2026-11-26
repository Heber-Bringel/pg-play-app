import type {
  ForcaCategory,
  MimicaCategory,
  QuizCategory,
} from '@/model/entities/arenaChallenge';
import type { DesenhoCategory } from '@/model/entities/drawingChallenge';

export type ContentPackGameId = 'mimica' | 'quiz' | 'forca' | 'desenho';

export type ContentPackCategory =
  | MimicaCategory
  | QuizCategory
  | ForcaCategory
  | DesenhoCategory;

export type ContentPack = {
  id: string;
  gameId: ContentPackGameId;
  category: ContentPackCategory;
  label: string;
  description: string;
  icon: string;
};
