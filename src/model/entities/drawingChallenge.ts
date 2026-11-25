export type DrawingPenColorId = 'ink' | 'purple' | 'coral' | 'green';

export type DrawingStrokeWidthId = 'thin' | 'thick';

export type DrawingShapeToolId = 'line' | 'rectangle' | 'circle' | 'triangle';

export type DrawingToolId = 'freehand' | DrawingShapeToolId;

export type DrawingFillMode = 'stroke' | 'fill';

export type DrawingPoint = {
  x: number;
  y: number;
};

export type DrawingFreehandElement = {
  id: string;
  tool: 'freehand';
  points: DrawingPoint[];
  colorId: DrawingPenColorId;
  widthId: DrawingStrokeWidthId;
};

export type DrawingShapeElement = {
  id: string;
  tool: DrawingShapeToolId;
  start: DrawingPoint;
  end: DrawingPoint;
  fillMode: DrawingFillMode;
  colorId: DrawingPenColorId;
  widthId: DrawingStrokeWidthId;
};

export type DrawingElement = DrawingFreehandElement | DrawingShapeElement;

export type DrawingElementDraft =
  | Omit<DrawingFreehandElement, 'id'>
  | Omit<DrawingShapeElement, 'id'>;

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
