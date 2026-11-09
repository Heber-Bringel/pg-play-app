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
