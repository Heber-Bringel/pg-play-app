export interface IScreenOrientationService {
  lockLandscape(): Promise<void>;
  unlock(): Promise<void>;
}
