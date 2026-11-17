import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';
import type { Minigame } from '@/model/entities/minigame';

export interface IGameCatalogDataSource {
  listMinigames(): Promise<Minigame[]>;
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
  listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>;
  listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]>;
}
