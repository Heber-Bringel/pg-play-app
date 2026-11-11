export type MimicaCategory =
  | 'Bíblico'
  | 'Filmes e Séries'
  | 'Animais'
  | 'Profissões'
  | 'Esportes'
  | 'Ações do Dia a Dia'
  | 'Cultura Pop';

export type MimicaCard = {
  id: string;
  word: string;
  category: MimicaCategory;
  points: number;
};

export type ForcaCategory =
  | 'Bíblico'
  | 'Animais'
  | 'Países e Cidades'
  | 'Frutas e Comidas'
  | 'Filmes'
  | 'Profissões'
  | 'Esportes';

export type ForcaPuzzle = {
  id: string;
  word: string;
  hint: string;
  category: ForcaCategory;
};

export type QuizCategory =
  | 'Bíblico'
  | 'Conhecimentos Gerais'
  | 'Geografia'
  | 'História'
  | 'Ciência'
  | 'Música e Cinema'
  | 'Esportes';

export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export type QuizOptionItem = {
  key: QuizOptionKey;
  text: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOptionItem[];
  correctKey: QuizOptionKey;
  explanation?: string;
  category: QuizCategory;
};
