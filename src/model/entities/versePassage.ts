export type VersePack =
  | 'Salmos e Provérbios'
  | 'Evangelhos'
  | 'Cartas de Paulo'
  | 'Antigo Testamento';

export type VerseBlank = {
  index: number;
  answer: string;
  options: string[];
};

export type VersePassage = {
  id: string;
  pack: VersePack;
  textWithBlanks: string;
  fullText: string;
  blanks: VerseBlank[];
  reference: string;
  translation: string;
};

export type VerseBlankResult = {
  index: number;
  userAnswer: string;
  expectedAnswer: string;
  isCorrect: boolean;
  pointsAwarded: number;
};

export type VerseDurationOption = 30 | 45 | 60;

export type VerseMatchConfig = {
  packs: VersePack[];
  durationSeconds: VerseDurationOption;
  passagesPerTeam: number;
};

export type VerseHint = {
  index: number;
  maskedWord: string;
  eliminatedOptions: string[];
};
