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

  async triggerTimerPulse(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ambientes como navegador web ou simuladores podem não suportar háptica.
    }
  }

  async triggerTimerExpired(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ambientes como navegador web ou simuladores podem não suportar háptica.
    }
  }

  async triggerAnswerWrong(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ambientes como navegador web ou simuladores podem não suportar háptica.
    }
  }

  async triggerLetterWrong(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ambientes como navegador web ou simuladores podem não suportar háptica.
    }
  }
}
