import * as Haptics from 'expo-haptics';
import { ExpoHapticService } from '@/infra/services/expoHapticService';

// Métodos do cronômetro, do acerto e do erro no ExpoHapticService (issue #77, spec 026).
// O expo-haptics é substituído por tests/__mocks__/expo-haptics.ts.

const impactAsync = Haptics.impactAsync as jest.Mock;
const notificationAsync = Haptics.notificationAsync as jest.Mock;

describe('ExpoHapticService — vibração do cronômetro e do erro (#77)', () => {
  beforeEach(() => {
    impactAsync.mockClear();
    notificationAsync.mockClear();
  });

  it('pulso do cronômetro usa impacto leve', async () => {
    await new ExpoHapticService().triggerTimerPulse();

    expect(impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('tempo esgotado usa a notificação de erro (vibração forte)', async () => {
    await new ExpoHapticService().triggerTimerExpired();

    expect(notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error
    );
  });

  it('resposta errada usa a notificação de erro e letra errada o impacto médio', async () => {
    const service = new ExpoHapticService();

    await service.triggerAnswerWrong();
    await service.triggerLetterWrong();

    expect(notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error
    );
    expect(impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('não lança erro quando o aparelho não tem motor háptico (web, emulador)', async () => {
    impactAsync.mockRejectedValueOnce(new Error('sem háptica'));
    notificationAsync.mockRejectedValueOnce(new Error('sem háptica'));
    const service = new ExpoHapticService();

    await expect(service.triggerTimerPulse()).resolves.toBeUndefined();
    await expect(service.triggerTimerExpired()).resolves.toBeUndefined();
    impactAsync.mockRejectedValueOnce(new Error('sem háptica'));
    notificationAsync.mockRejectedValueOnce(new Error('sem háptica'));
    await expect(service.triggerAnswerWrong()).resolves.toBeUndefined();
    await expect(service.triggerLetterWrong()).resolves.toBeUndefined();
  });
});
