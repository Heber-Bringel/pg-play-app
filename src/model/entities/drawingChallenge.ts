export type DrawingPenColorId = 'ink' | 'purple' | 'coral' | 'green';

export type DrawingStrokeWidthId = 'thin' | 'thick';

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingStroke = {
  id: string;
  points: DrawingPoint[];
  colorId: DrawingPenColorId;
  widthId: DrawingStrokeWidthId;
};

export type DesenhoCategory =
  | 'Bíblico'
  | 'Animais'
  | 'Objetos'
  | 'Comidas'
  | 'Lugares e Natureza';

export type DesenhoCard = {
  id: string;
  word: string;
  category: DesenhoCategory;
  points: number;
};
