import * as ScreenOrientation from 'expo-screen-orientation';
import type { IScreenOrientationService } from '@/model/services/iScreenOrientationService';

export class ExpoScreenOrientationService implements IScreenOrientationService {
  async lockLandscape(): Promise<void> {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    } catch {
      // Ambientes como navegador desktop/web podem não suportar lock de orientação.
    }
  }

  async unlock(): Promise<void> {
    try {
      await ScreenOrientation.unlockAsync();
    } catch {
      // Ignora falha em ambientes sem controle nativo de orientação.
    }
  }
}
