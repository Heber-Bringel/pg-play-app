import type { CidadeDormeVoiceProfile } from '@/model/entities/multiplayerSession';

export type NarratorSpeechRecord = {
  caption: string;
  voice: CidadeDormeVoiceProfile;
  timestamp: number;
};

export interface INarratorAudioService {
  speak(caption: string, voice: CidadeDormeVoiceProfile): Promise<void>;
  stop(): Promise<void>;
  getLastSpeech(): NarratorSpeechRecord | null;
  getSpeechHistory(): NarratorSpeechRecord[];
}
