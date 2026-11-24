import type { TiltGesture } from '@/model/entities/quemSouEuCard';
import type { ITiltSensorService } from '@/model/services/iTiltSensorService';

const DEFAULT_COOLDOWN_MS = 1000;

type ListenerEntry = {
  callback: (gesture: TiltGesture) => void;
  cooldownMs: number;
  lastTriggerAt: number;
};

export class MemoryTiltSensorService implements ITiltSensorService {
  private available: boolean;
  private listeners: Set<ListenerEntry> = new Set();
  private nowProvider: () => number;

  constructor(
    available: boolean = true,
    nowProvider: () => number = () => Date.now()
  ) {
    this.available = available;
    this.nowProvider = nowProvider;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  subscribe(
    onGesture: (gesture: TiltGesture) => void,
    cooldownMs: number = DEFAULT_COOLDOWN_MS
  ): () => void {
    const entry: ListenerEntry = {
      callback: onGesture,
      cooldownMs,
      lastTriggerAt: -Infinity,
    };
    this.listeners.add(entry);

    return () => {
      this.listeners.delete(entry);
    };
  }

  emitGesture(gesture: TiltGesture): void {
    if (!this.available) {
      return;
    }

    const now = this.nowProvider();
    for (const entry of this.listeners) {
      if (now - entry.lastTriggerAt >= entry.cooldownMs) {
        entry.lastTriggerAt = now;
        entry.callback(gesture);
      }
    }
  }

  getActiveSubscriberCount(): number {
    return this.listeners.size;
  }
}
