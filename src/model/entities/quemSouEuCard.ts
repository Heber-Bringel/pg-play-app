export type QuemSouEuPack =
  | 'Famosos'
  | 'Animais'
  | 'Filmes e Séries'
  | 'Desenhos e Animações'
  | 'Profissões'
  | 'Comidas'
  | 'Objetos do Dia a Dia'
  | 'Lugares do Mundo';

export type QuemSouEuDurationOption = 45 | 60 | 90;

export type QuemSouEuCard = {
  id: string;
  name: string;
  pack: QuemSouEuPack;
  hint?: string;
};

export type QuemSouEuMatchConfig = {
  packs: QuemSouEuPack[];
  durationSeconds: QuemSouEuDurationOption;
  roundsPerTeam: number;
  tiltEnabled: boolean;
};

export type QuemSouEuTurnOutcome = 'hit' | 'pass';

export type QuemSouEuCardResult = {
  card: QuemSouEuCard;
  outcome: QuemSouEuTurnOutcome;
  pointsAwarded: number;
};

export type TiltGesture = 'hit' | 'pass';
