import type { IScreenOrientationService } from '@/model/services/iScreenOrientationService';

export type MemoryOrientationMode = 'unlocked' | 'landscape';

export class MemoryScreenOrientationService
  implements IScreenOrientationService
{
  private mode: MemoryOrientationMode = 'unlocked';

  async lockLandscape(): Promise<void> {
    this.mode = 'landscape';
  }

  async unlock(): Promise<void> {
    this.mode = 'unlocked';
  }

  getCurrentMode(): MemoryOrientationMode {
    return this.mode;
  }
}
