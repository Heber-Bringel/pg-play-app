import * as Haptics from 'expo-haptics';
import type { IHapticService } from '@/model/services/iHapticService';

export class ExpoHapticService implements IHapticService {
  async triggerHit(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ambientes como navegador web ou simuladores podem não suportar háptica.
    }
  }

  async triggerPass(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ambientes como navegador web ou simuladores podem não suportar háptica.
    }
  }
}
