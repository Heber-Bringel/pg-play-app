export type TimerFeedbackOptions = {
  reduceMotion: boolean;
};

export type AnswerOutcome = 'correct' | 'wrong';

export interface IGameFeedbackUseCases {
  notifyTimerTick(
    previousSeconds: number,
    currentSeconds: number,
    options: TimerFeedbackOptions
  ): Promise<void>;
  notifyAnswer(outcome: AnswerOutcome): Promise<void>;
  notifyLetterGuess(isInWord: boolean): Promise<void>;
}
