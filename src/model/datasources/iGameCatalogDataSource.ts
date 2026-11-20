import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';
import type { ContentPack, ContentPackGameId } from '@/model/entities/contentPack';
import type { Minigame } from '@/model/entities/minigame';

export interface IGameCatalogDataSource {
  listMinigames(): Promise<Minigame[]>;
  listContentPacks(gameId?: ContentPackGameId): Promise<ContentPack[]>;
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
  listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>;
  listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]>;
}
