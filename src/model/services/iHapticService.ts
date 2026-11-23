export interface IHapticService {
  triggerHit(): Promise<void>;
  triggerPass(): Promise<void>;
}
