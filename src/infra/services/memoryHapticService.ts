import type { IHapticService } from '@/model/services/iHapticService';

export type HapticFeedbackCounts = {
  hits: number;
  pulses: number;
  expired: number;
  answersWrong: number;
  lettersWrong: number;
};

export class MemoryHapticService implements IHapticService {
  private hits = 0;
  private passes = 0;
  private timerPulses = 0;
  private timerExpired = 0;
  private answersWrong = 0;
  private lettersWrong = 0;

  async triggerHit(): Promise<void> {
    this.hits += 1;
  }

  async triggerPass(): Promise<void> {
    this.passes += 1;
  }

  async triggerTimerPulse(): Promise<void> {
    this.timerPulses += 1;
  }

  async triggerTimerExpired(): Promise<void> {
    this.timerExpired += 1;
  }

  async triggerAnswerWrong(): Promise<void> {
    this.answersWrong += 1;
  }

  async triggerLetterWrong(): Promise<void> {
    this.lettersWrong += 1;
  }

  getCounts(): { hits: number; passes: number } {
    return { hits: this.hits, passes: this.passes };
  }

  // Cronômetro, acerto e erro (issue #77, spec 026).
  getFeedbackCounts(): HapticFeedbackCounts {
    return {
      hits: this.hits,
      pulses: this.timerPulses,
      expired: this.timerExpired,
      answersWrong: this.answersWrong,
      lettersWrong: this.lettersWrong,
    };
  }
}
