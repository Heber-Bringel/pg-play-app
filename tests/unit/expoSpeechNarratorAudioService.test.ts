import * as Speech from 'expo-speech';
import { ExpoSpeechNarratorAudioService } from '@/infra/services/expoSpeechNarratorAudioService';
import { DataSourceError } from '@/model/errors';

describe('ExpoSpeechNarratorAudioService — Síntese de Voz do Narrador (Issue #32)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'pt-br-male-daniel',
        name: 'Daniel',
        language: 'pt-BR',
        quality: 'Default',
      },
      {
        identifier: 'pt-br-female-luciana',
        name: 'Luciana',
        language: 'pt-BR',
        quality: 'Enhanced',
      },
    ]);
    (Speech.stop as jest.Mock).mockResolvedValue(undefined);
    (Speech.speak as jest.Mock).mockImplementation(() => {});
  });

  it('deve reproduzir fala em pt-BR para vozes masculina e feminina e registrar histórico', async () => {
    const service = new ExpoSpeechNarratorAudioService();

    await service.speak('A cidade dorme... Todos fecham os olhos.', 'masculina');

    expect(Speech.stop).toHaveBeenCalledTimes(1);
    expect(Speech.speak).toHaveBeenCalledWith(
      'A cidade dorme... Todos fecham os olhos.',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.92,
        voice: 'pt-br-male-daniel',
      })
    );
    expect(service.getLastSpeech()?.caption).toBe(
      'A cidade dorme... Todos fecham os olhos.'
    );
    expect(service.getLastSpeech()?.voice).toBe('masculina');
    expect(service.getSpeechHistory()).toHaveLength(1);

    await service.speak('A cidade acorda!', 'feminina');

    expect(Speech.stop).toHaveBeenCalledTimes(2);
    expect(Speech.speak).toHaveBeenLastCalledWith(
      'A cidade acorda!',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 1.08,
        voice: 'pt-br-female-luciana',
      })
    );
    expect(service.getSpeechHistory()).toHaveLength(2);
  });

  it('deve evitar disparo duplicado da mesma fala dentro da janela de 1500 ms', async () => {
    const service = new ExpoSpeechNarratorAudioService();

    await service.speak('Assassino, acorde!', 'masculina');
    await service.speak('Assassino, acorde!', 'masculina');

    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect(service.getSpeechHistory()).toHaveLength(1);
  });

  it('deve parar a fala ativa e limpar getLastSpeech ao chamar stop()', async () => {
    const service = new ExpoSpeechNarratorAudioService();

    await service.speak('Turno do Anjo', 'feminina');
    expect(service.getLastSpeech()).not.toBeNull();

    await service.stop();
    expect(Speech.stop).toHaveBeenCalledTimes(2);
    expect(service.getLastSpeech()).toBeNull();
  });

  it('deve converter erro interno do expo-speech em DataSourceError', async () => {
    const service = new ExpoSpeechNarratorAudioService();
    (Speech.speak as jest.Mock).mockImplementationOnce(() => {
      throw new Error('TTS engine unavailable');
    });

    await expect(
      service.speak('Falha simulada', 'masculina')
    ).rejects.toThrow(DataSourceError);
  });
});
