import type { ISoundService } from '@/model/services/iSoundService';

export type SoundFeedbackCounts = {
  correct: number;
  wrong: number;
  letterWrong: number;
  pass: number;
  timerTick: number;
  timerCritical: number;
  timerExpired: number;
};

export class MemorySoundService implements ISoundService {
  private correct = 0;
  private wrong = 0;
  private letterWrong = 0;
  private pass = 0;
  private timerTick = 0;
  private timerCritical = 0;
  private timerExpired = 0;

  async playCorrect(): Promise<void> {
    this.correct += 1;
  }

  async playWrong(): Promise<void> {
    this.wrong += 1;
  }

  async playLetterWrong(): Promise<void> {
    this.letterWrong += 1;
  }

  async playPass(): Promise<void> {
    this.pass += 1;
  }

  async playTimerTick(): Promise<void> {
    this.timerTick += 1;
    this.timerCritical += 1;
  }

  async playTimerCritical(): Promise<void> {
    this.timerCritical += 1;
    this.timerTick += 1;
  }

  async playTimerExpired(): Promise<void> {
    this.timerExpired += 1;
  }

  getSoundCounts(): SoundFeedbackCounts {
    return {
      correct: this.correct,
      wrong: this.wrong,
      letterWrong: this.letterWrong,
      pass: this.pass,
      timerTick: this.timerTick,
      timerCritical: this.timerCritical,
      timerExpired: this.timerExpired,
    };
  }
}
