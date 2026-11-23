import type { IHapticService } from '@/model/services/iHapticService';

export class MemoryHapticService implements IHapticService {
  private hits = 0;
  private passes = 0;

  async triggerHit(): Promise<void> {
    this.hits += 1;
  }

  async triggerPass(): Promise<void> {
    this.passes += 1;
  }

  getCounts(): { hits: number; passes: number } {
    return { hits: this.hits, passes: this.passes };
  }
}
