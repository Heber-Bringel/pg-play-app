import type { CidadeDormeVoiceProfile } from '@/model/entities/multiplayerSession';
import { DataSourceError } from '@/model/errors';
import type {
  INarratorAudioService,
  NarratorSpeechRecord,
} from '@/model/services/iNarratorAudioService';

export class MemoryNarratorAudioService implements INarratorAudioService {
  private history: NarratorSpeechRecord[] = [];
  private activeSpeech: NarratorSpeechRecord | null = null;

  async speak(caption: string, voice: CidadeDormeVoiceProfile): Promise<void> {
    try {
      const cleanCaption = caption.trim();
      const record: NarratorSpeechRecord = {
        caption: cleanCaption,
        voice,
        timestamp: Date.now(),
      };
      this.activeSpeech = record;
      this.history.push(record);
    } catch {
      throw new DataSourceError(
        'Não foi possível reproduzir a fala do Narrador.'
      );
    }
  }

  async stop(): Promise<void> {
    this.activeSpeech = null;
  }

  getLastSpeech(): NarratorSpeechRecord | null {
    return this.activeSpeech ? { ...this.activeSpeech } : null;
  }

  getSpeechHistory(): NarratorSpeechRecord[] {
    return this.history.map((item) => ({ ...item }));
  }
}
