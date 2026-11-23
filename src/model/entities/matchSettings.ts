export type MimicaDurationOption = 45 | 60 | 90;
export type QuizDurationOption = 15 | 20 | 30;
export type QuizQuestionCountOption = 5 | 10 | 15;
export type ForcaAttemptsOption = 5 | 6 | 8;

export const QUIZ_QUESTION_COUNT_OPTIONS: readonly QuizQuestionCountOption[] = [5, 10, 15];

export type MimicaSettings = {
  durationSeconds: MimicaDurationOption;
  totalRounds: number;
};

export type QuizSettings = {
  durationSeconds: QuizDurationOption;
  questionCount: QuizQuestionCountOption;
};

export type ForcaSettings = {
  maxAttempts: ForcaAttemptsOption;
  totalRounds: number;
};

export type MatchSettings = {
  mimica: MimicaSettings;
  quiz: QuizSettings;
  forca: ForcaSettings;
};

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  mimica: {
    durationSeconds: 60,
    totalRounds: 3,
  },
  quiz: {
    durationSeconds: 20,
    questionCount: 10,
  },
  forca: {
    maxAttempts: 6,
    totalRounds: 3,
  },
};

// Plano efetivo de uma partida de Quiz: quantas perguntas serão jogadas
// para que todas as equipes respondam a mesma quantidade.
export type QuizMatchPlan = {
  totalQuestions: number;
  questionsPerTeam: number;
  limitedByBank: boolean;
};
