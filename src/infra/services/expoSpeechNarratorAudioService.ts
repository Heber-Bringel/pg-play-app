import * as Speech from 'expo-speech';
import type { CidadeDormeVoiceProfile } from '@/model/entities/multiplayerSession';
import { DataSourceError } from '@/model/errors';
import type {
  INarratorAudioService,
  NarratorSpeechRecord,
} from '@/model/services/iNarratorAudioService';

const MALE_VOICE_HINTS = [
  'daniel',
  'luciano',
  'ricardo',
  'felipe',
  'antonio',
  'fabio',
  'humberto',
  'nicolau',
  'valerio',
  'donato',
  'julio',
  'duarte',
  'thiago',
  'tiago',
  'cristiano',
  'luca',
  'joaquim',
  'jorge',
  'carlos',
  'pedro',
  'joao',
  'miguel',
  'rafael',
  'gabriel',
  'pt-br-x-ptd',
  'pt-br-x-htm',
  'pt-br-x-bmm',
  'pt-pt-x-sfs',
  'pt-pt-x-pmj',
  'neural2-b',
  'wavenet-b',
  'wavenet-d',
  'standard-b',
  'standard-e',
  'masculin',
  'homem',
];

const FEMALE_VOICE_HINTS = [
  'luciana',
  'maria',
  'francisca',
  'vitoria',
  'camila',
  'thalita',
  'helba',
  'leila',
  'leticia',
  'manuela',
  'yara',
  'giovanna',
  'brenda',
  'elza',
  'raquel',
  'fernanda',
  'ines',
  'joana',
  'catarina',
  'ana',
  'julia',
  'larissa',
  'amanda',
  'beatriz',
  'carla',
  'pt-br-x-afs',
  'pt-br-x-pte',
  'pt-br-x-ptf',
  'pt-br-x-bmf',
  'neural2-a',
  'neural2-c',
  'wavenet-a',
  'wavenet-c',
  'standard-a',
  'standard-c',
  'feminin',
  'mulher',
];

const FEMALE_TOKEN_REGEX = /(?:^|[^a-z])female(?:\d*|$|[^a-z])/;
const MALE_TOKEN_REGEX = /(?:^|[^a-z])male(?:\d*|$|[^a-z])/;

function buildHintRegex(hint: string): RegExp {
  const escaped = hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (hint === 'masculin' || hint === 'feminin') {
    return new RegExp(`(?:^|[^a-z])${escaped}[a-z]*(?:$|[^a-z])`);
  }
  return new RegExp(`(?:^|[^a-z])${escaped}(?:$|[^a-z])`);
}

const MALE_VOICE_REGEXES = MALE_VOICE_HINTS.map(buildHintRegex);
const FEMALE_VOICE_REGEXES = FEMALE_VOICE_HINTS.map(buildHintRegex);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function normalizeLanguage(language: string): string {
  return language.toLowerCase().replace(/_/g, '-');
}

function normalizeVoiceTarget(voice: Speech.Voice): string {
  return normalizeText(`${voice.name} ${voice.identifier}`);
}

function isExplicitFemaleVoice(voice: Speech.Voice): boolean {
  const target = normalizeVoiceTarget(voice);
  if (MALE_TOKEN_REGEX.test(target) && !FEMALE_TOKEN_REGEX.test(target)) {
    return false;
  }
  return (
    FEMALE_TOKEN_REGEX.test(target) ||
    FEMALE_VOICE_REGEXES.some((regex) => regex.test(target))
  );
}

function isExplicitMaleVoice(voice: Speech.Voice): boolean {
  const target = normalizeVoiceTarget(voice);
  if (FEMALE_TOKEN_REGEX.test(target)) {
    return false;
  }
  if (FEMALE_VOICE_REGEXES.some((regex) => regex.test(target))) {
    return false;
  }
  return (
    MALE_TOKEN_REGEX.test(target) ||
    MALE_VOICE_REGEXES.some((regex) => regex.test(target))
  );
}

type ResolvedVoiceSelection = {
  voiceId: string | undefined;
  hasExplicitGenderMatch: boolean;
};

const DUPLICATE_SPEECH_WINDOW_MS = 1500;

export class ExpoSpeechNarratorAudioService implements INarratorAudioService {
  private history: NarratorSpeechRecord[] = [];
  private activeSpeech: NarratorSpeechRecord | null = null;
  private cachedVoices: Speech.Voice[] | null = null;

  private async getVoices(): Promise<Speech.Voice[]> {
    if (this.cachedVoices !== null && this.cachedVoices.length > 0) {
      return this.cachedVoices;
    }

    try {
      const available = await Speech.getAvailableVoicesAsync();
      if (available.length > 0) {
        this.cachedVoices = available;
      }
      return available;
    } catch (_err: unknown) {
      return [];
    }
  }

  private async resolveVoiceSelection(
    profile: CidadeDormeVoiceProfile
  ): Promise<ResolvedVoiceSelection> {
    const voices = await this.getVoices();
    if (voices.length === 0) {
      return { voiceId: undefined, hasExplicitGenderMatch: false };
    }

    const ptBrVoices = voices.filter((v) =>
      normalizeLanguage(v.language).startsWith('pt-br')
    );
    const allPtVoices = voices.filter((v) => {
      const lang = normalizeLanguage(v.language);
      return lang === 'pt' || lang.startsWith('pt-');
    });
    const ptVoices = ptBrVoices.length > 0 ? ptBrVoices : allPtVoices;

    if (ptVoices.length === 0) {
      return { voiceId: undefined, hasExplicitGenderMatch: false };
    }

    const matchesRequestedGender =
      profile === 'masculina' ? isExplicitMaleVoice : isExplicitFemaleVoice;
    const matchesOppositeGender =
      profile === 'masculina' ? isExplicitFemaleVoice : isExplicitMaleVoice;

    const explicitInPreferred = ptVoices.find(matchesRequestedGender);
    if (explicitInPreferred) {
      return {
        voiceId: explicitInPreferred.identifier,
        hasExplicitGenderMatch: true,
      };
    }

    const explicitInAllPt = allPtVoices.find(matchesRequestedGender);
    if (explicitInAllPt) {
      return {
        voiceId: explicitInAllPt.identifier,
        hasExplicitGenderMatch: true,
      };
    }

    const nonOppositeVoices = ptVoices.filter(
      (v) => !matchesOppositeGender(v)
    );
    if (nonOppositeVoices.length > 0) {
      return {
        voiceId: nonOppositeVoices[0].identifier,
        hasExplicitGenderMatch: false,
      };
    }

    return {
      voiceId: ptVoices[0].identifier,
      hasExplicitGenderMatch: false,
    };
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
      const { voiceId, hasExplicitGenderMatch } =
        await this.resolveVoiceSelection(voice);
      const pitch =
        voice === 'masculina'
          ? hasExplicitGenderMatch
            ? 0.92
            : 0.65
          : 1.08;
      const rate =
        voice === 'masculina' && !hasExplicitGenderMatch ? 0.94 : 0.98;
      Speech.speak(cleanCaption, {
        language: 'pt-BR',
        rate,
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
