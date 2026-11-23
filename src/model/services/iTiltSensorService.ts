import type { TiltGesture } from '@/model/entities/quemSouEuCard';

export interface ITiltSensorService {
  isAvailable(): Promise<boolean>;
  subscribe(
    onGesture: (gesture: TiltGesture) => void,
    cooldownMs?: number
  ): () => void;
}
