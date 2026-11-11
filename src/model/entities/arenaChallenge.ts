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
