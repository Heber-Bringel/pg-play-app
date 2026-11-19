import * as Speech from 'expo-speech';
import type { CidadeDormeVoiceProfile } from '@/model/entities/multiplayerSession';
import { DataSourceError } from '@/model/errors';
import type {
  INarratorAudioService,
  NarratorSpeechRecord,
} from '@/model/services/iNarratorAudioService';

const MALE_VOICE_HINTS = [
  'male',
  'daniel',
  'luciano',
  'ricardo',
  'felipe',
  'pt-br-x-ptd',
  'pt-br-x-pte',
];

const FEMALE_VOICE_HINTS = [
  'female',
  'luciana',
  'maria',
  'francisca',
  'vitoria',
  'camila',
  'pt-br-x-afs',
  'pt-br-x-ptf',
];

const DUPLICATE_SPEECH_WINDOW_MS = 1500;

export class ExpoSpeechNarratorAudioService implements INarratorAudioService {
  private history: NarratorSpeechRecord[] = [];
  private activeSpeech: NarratorSpeechRecord | null = null;
  private cachedVoices: Speech.Voice[] | null = null;

  private async resolveVoiceIdentifier(
    profile: CidadeDormeVoiceProfile
  ): Promise<string | undefined> {
    if (this.cachedVoices === null) {
      try {
        this.cachedVoices = await Speech.getAvailableVoicesAsync();
      } catch (_err: unknown) {
        return undefined;
      }
    }

    const ptBrVoices = this.cachedVoices.filter((v) =>
      v.language.toLowerCase().startsWith('pt-br')
    );
    const ptVoices =
      ptBrVoices.length > 0
        ? ptBrVoices
        : this.cachedVoices.filter((v) =>
            v.language.toLowerCase().startsWith('pt')
          );

    if (ptVoices.length === 0) {
      return undefined;
    }

    const hints =
      profile === 'masculina' ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
    const matched = ptVoices.find((v) => {
      const target = `${v.name} ${v.identifier}`.toLowerCase();
      return hints.some((hint) => target.includes(hint));
    });

    if (matched) {
      return matched.identifier;
    }

    if (ptVoices.length >= 2) {
      return profile === 'masculina'
        ? ptVoices[0].identifier
        : ptVoices[1].identifier;
    }

    return ptVoices[0].identifier;
  }

  async speak(caption: string, voice: CidadeDormeVoiceProfile): Promise<void> {
    const cleanCaption = caption.trim();
    if (!cleanCaption) {
      return;
    }

    const now = Date.now();
    if (
      this.activeSpeech &&
      this.activeSpeech.caption === cleanCaption &&
      this.activeSpeech.voice === voice &&
      now - this.activeSpeech.timestamp < DUPLICATE_SPEECH_WINDOW_MS
    ) {
      return;
    }

    try {
      await Speech.stop();
      const voiceId = await this.resolveVoiceIdentifier(voice);
      const pitch = voice === 'masculina' ? 0.92 : 1.08;
      Speech.speak(cleanCaption, {
        language: 'pt-BR',
        rate: 0.98,
        pitch,
        ...(voiceId ? { voice: voiceId } : {}),
      });

      const record: NarratorSpeechRecord = {
        caption: cleanCaption,
        voice,
        timestamp: now,
      };
      this.activeSpeech = record;
      this.history.push(record);
    } catch (_err: unknown) {
      throw new DataSourceError(
        'Não foi possível reproduzir a fala do Narrador.'
      );
    }
  }

  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (_err: unknown) {
      // Ignora falha silenciosa ao parar a síntese de voz.
    } finally {
      this.activeSpeech = null;
    }
  }

  getLastSpeech(): NarratorSpeechRecord | null {
    return this.activeSpeech ? { ...this.activeSpeech } : null;
  }

  getSpeechHistory(): NarratorSpeechRecord[] {
    return this.history.map((item) => ({ ...item }));
  }
}
