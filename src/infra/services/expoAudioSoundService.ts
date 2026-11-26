import {
  createAudioPlayer,
  preload,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import type { ISoundService } from '@/model/services/iSoundService';

export type SoundEffectKey =
  | 'correct'
  | 'wrong'
  | 'letterWrong'
  | 'pass'
  | 'timerTick'
  | 'timerCritical'
  | 'timerExpired';

export type SoundSourcesMap = Record<SoundEffectKey, AudioSource>;

// Fontes de áudio CC0 em assets/sons/ (ver assets/sons/CREDITOS.md).
/* eslint-disable @typescript-eslint/no-require-imports */
export const DEFAULT_SOUND_SOURCES: SoundSourcesMap = {
  correct: require('../../../assets/sons/acerto.wav') as AudioSource,
  wrong: require('../../../assets/sons/erro.wav') as AudioSource,
  letterWrong: require('../../../assets/sons/letra-errada.wav') as AudioSource,
  pass: require('../../../assets/sons/passe.wav') as AudioSource,
  timerTick: require('../../../assets/sons/tick-10s.wav') as AudioSource,
  timerCritical: require('../../../assets/sons/alerta-10s.wav') as AudioSource,
  timerExpired: require('../../../assets/sons/tempo-esgotado.wav') as AudioSource,
};
/* eslint-enable @typescript-eslint/no-require-imports */

const SOUND_KEYS: readonly SoundEffectKey[] = [
  'correct',
  'wrong',
  'letterWrong',
  'pass',
  'timerTick',
  'timerCritical',
  'timerExpired',
];

export class ExpoAudioSoundService implements ISoundService {
  private readonly sources: SoundSourcesMap;
  private readonly players: Partial<Record<SoundEffectKey, AudioPlayer>> = {};
  private audioModeConfigured = false;
  private preloaded = false;

  constructor(sources: SoundSourcesMap = DEFAULT_SOUND_SOURCES) {
    this.sources = sources;
    this.preloadAll();
    void this.ensureAudioModeAsync();
  }

  private async ensureAudioModeAsync(): Promise<void> {
    if (this.audioModeConfigured) {
      return;
    }
    try {
      // Respeita a chave física de modo silencioso do iPhone (playsInSilentMode: false)
      // e mistura com outros áudios sem interromper músicas/chamadas.
      await setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
      });
      this.audioModeConfigured = true;
    } catch {
      // Degradação silenciosa em ambientes sem suporte a áudio (web/emulador/testes).
    }
  }

  private preloadAll(): void {
    if (this.preloaded) {
      return;
    }
    this.preloaded = true;
    for (const key of SOUND_KEYS) {
      try {
        void preload(this.sources[key]).catch(() => {
          // Degradação silenciosa caso o preload não seja suportado na plataforma.
        });
      } catch {
        // Degradação silenciosa caso o preload lance erro síncrono.
      }
      this.getOrCreatePlayer(key);
    }
  }

  private getOrCreatePlayer(key: SoundEffectKey): AudioPlayer | null {
    const existing = this.players[key];
    if (existing) {
      return existing;
    }
    try {
      const player = createAudioPlayer(this.sources[key]);
      this.players[key] = player;
      return player;
    } catch {
      return null;
    }
  }

  private async playSound(key: SoundEffectKey): Promise<void> {
    try {
      await this.ensureAudioModeAsync();
      const player = this.getOrCreatePlayer(key);
      if (!player) {
        return;
      }
      try {
        await player.seekTo(0);
      } catch {
        // Se seekTo falhar antes do primeiro play, prossegue com play().
      }
      player.play();
    } catch {
      // Degradação silenciosa: falha de áudio nunca interrompe a partida.
    }
  }

  async playCorrect(): Promise<void> {
    await this.playSound('correct');
  }

  async playWrong(): Promise<void> {
    await this.playSound('wrong');
  }

  async playLetterWrong(): Promise<void> {
    await this.playSound('letterWrong');
  }

  async playPass(): Promise<void> {
    await this.playSound('pass');
  }

  async playTimerTick(): Promise<void> {
    await this.playSound('timerTick');
  }

  async playTimerCritical(): Promise<void> {
    await this.playSound('timerCritical');
  }

  async playTimerExpired(): Promise<void> {
    await this.playSound('timerExpired');
  }
}
