import type {
  ForcaCategory,
  ForcaPuzzle,
  MimicaCard,
  MimicaCategory,
  QuizCategory,
  QuizQuestion,
} from '@/model/entities/arenaChallenge';

export interface IGameCatalogDataSource {
  listMimicaCards(categories?: MimicaCategory[]): Promise<MimicaCard[]>;
  listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>;
  listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]>;
}
