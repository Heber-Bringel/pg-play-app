import { Accelerometer } from 'expo-sensors';
import type { TiltGesture } from '@/model/entities/quemSouEuCard';
import type { ITiltSensorService } from '@/model/services/iTiltSensorService';

const DEFAULT_COOLDOWN_MS = 1000;
const UPDATE_INTERVAL_MS = 100;
const TILT_THRESHOLD_Z = 0.72;
const NEUTRAL_THRESHOLD_Z = 0.35;

export class ExpoSensorsTiltSensorService implements ITiltSensorService {
  async isAvailable(): Promise<boolean> {
    try {
      return await Accelerometer.isAvailableAsync();
    } catch {
      return false;
    }
  }

  subscribe(
    onGesture: (gesture: TiltGesture) => void,
    cooldownMs: number = DEFAULT_COOLDOWN_MS
  ): () => void {
    let lastTriggerAt = 0;
    // Exige que o celular passe pela posição neutra antes do primeiro gesto,
    // evitando acerto/passe automático se ele já estiver inclinado.
    let awaitingNeutral = true;

    try {
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
      const subscription = Accelerometer.addListener(({ z }) => {
        if (awaitingNeutral) {
          if (Math.abs(z) <= NEUTRAL_THRESHOLD_Z) {
            awaitingNeutral = false;
          }
          return;
        }

        const now = Date.now();
        if (now - lastTriggerAt < cooldownMs) {
          return;
        }

        // Celular na testa com a tela virada para a equipe:
        // inclinar para baixo (tela voltada para o chão) -> z >= +0.72 => acerto
        // inclinar para cima (tela voltada para o teto) -> z <= -0.72 => passe
        if (z >= TILT_THRESHOLD_Z) {
          lastTriggerAt = now;
          awaitingNeutral = true;
          onGesture('hit');
        } else if (z <= -TILT_THRESHOLD_Z) {
          lastTriggerAt = now;
          awaitingNeutral = true;
          onGesture('pass');
        }
      });

      return () => {
        try {
          subscription.remove();
        } catch {
          // Ignora falha ao remover listener em ambientes sem sensor ativo.
        }
      };
    } catch {
      return () => {};
    }
  }
}
