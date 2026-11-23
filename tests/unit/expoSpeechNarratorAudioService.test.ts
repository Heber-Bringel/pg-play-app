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

  it('não deve confundir "female" com "male" quando a voz feminina aparece antes da masculina', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'pt-br-female-luciana',
        name: 'Portuguese (Brazil) Female',
        language: 'pt-BR',
        quality: 'Enhanced',
      },
      {
        identifier: 'pt-br-male-daniel',
        name: 'Portuguese (Brazil) Male',
        language: 'pt-BR',
        quality: 'Default',
      },
    ]);

    const service = new ExpoSpeechNarratorAudioService();
    await service.speak('A cidade dorme...', 'masculina');

    expect(Speech.speak).toHaveBeenCalledWith(
      'A cidade dorme...',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.92,
        rate: 0.98,
        voice: 'pt-br-male-daniel',
      })
    );
  });

  it('deve ignorar vozes femininas do Android Google TTS (afs e pte) com locale pt_BR e selecionar ptd/htm para masculina', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'pt-br-x-afs-local',
        name: 'pt-br-x-afs-local',
        language: 'pt_BR',
        quality: 'Default',
      },
      {
        identifier: 'pt-br-x-pte-local',
        name: 'pt-br-x-pte-local',
        language: 'pt_BR',
        quality: 'Default',
      },
      {
        identifier: 'pt-br-x-ptd-local',
        name: 'pt-br-x-ptd-local',
        language: 'pt_BR',
        quality: 'Default',
      },
      {
        identifier: 'pt-br-x-htm-local',
        name: 'pt-br-x-htm-local',
        language: 'pt_BR',
        quality: 'Default',
      },
    ]);

    const service = new ExpoSpeechNarratorAudioService();
    await service.speak('Assassino, escolha sua vítima.', 'masculina');

    expect(Speech.speak).toHaveBeenCalledWith(
      'Assassino, escolha sua vítima.',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.92,
        rate: 0.98,
        voice: 'pt-br-x-ptd-local',
      })
    );

    await service.speak('Anjo, acorde.', 'feminina');
    expect(Speech.speak).toHaveBeenLastCalledWith(
      'Anjo, acorde.',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 1.08,
        rate: 0.98,
        voice: 'pt-br-x-afs-local',
      })
    );
  });

  it('deve selecionar Microsoft Antonio para voz masculina quando Microsoft Francisca estiver na posição 0', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)',
        name: 'Microsoft Francisca Online (Natural) - Portuguese (Brazil)',
        language: 'pt-BR',
        quality: 'Enhanced',
      },
      {
        identifier: 'Microsoft Antônio Online (Natural) - Portuguese (Brazil)',
        name: 'Microsoft Antônio Online (Natural) - Portuguese (Brazil)',
        language: 'pt-BR',
        quality: 'Enhanced',
      },
    ]);

    const service = new ExpoSpeechNarratorAudioService();
    await service.speak('Detetive, aponte um suspeito.', 'masculina');

    expect(Speech.speak).toHaveBeenCalledWith(
      'Detetive, aponte um suspeito.',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.92,
        rate: 0.98,
        voice: 'Microsoft Antônio Online (Natural) - Portuguese (Brazil)',
      })
    );
  });

  it('deve aplicar pitch 0.65 e rate 0.94 para voz masculina quando o dispositivo só tiver voz genérica ou feminina', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'Google português do Brasil',
        name: 'Google português do Brasil',
        language: 'pt-BR',
        quality: 'Default',
      },
    ]);

    const genericService = new ExpoSpeechNarratorAudioService();
    await genericService.speak('A cidade acorda!', 'masculina');

    expect(Speech.speak).toHaveBeenCalledWith(
      'A cidade acorda!',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.65,
        rate: 0.94,
        voice: 'Google português do Brasil',
      })
    );

    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'pt-br-female-luciana',
        name: 'Luciana',
        language: 'pt-BR',
        quality: 'Enhanced',
      },
    ]);

    const femaleOnlyService = new ExpoSpeechNarratorAudioService();
    await femaleOnlyService.speak('Todos fecham os olhos.', 'masculina');

    expect(Speech.speak).toHaveBeenLastCalledWith(
      'Todos fecham os olhos.',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.65,
        rate: 0.94,
        voice: 'pt-br-female-luciana',
      })
    );
  });

  it('deve consultar getAvailableVoicesAsync novamente se a primeira chamada retornar lista vazia', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          identifier: 'pt-br-female-luciana',
          name: 'Luciana',
          language: 'pt-BR',
          quality: 'Enhanced',
        },
        {
          identifier: 'pt-br-male-daniel',
          name: 'Daniel',
          language: 'pt-BR',
          quality: 'Default',
        },
      ]);

    const service = new ExpoSpeechNarratorAudioService();

    await service.speak('Primeira tentativa sem vozes carregadas.', 'masculina');
    expect(Speech.speak).toHaveBeenNthCalledWith(1, 'Primeira tentativa sem vozes carregadas.', {
      language: 'pt-BR',
      pitch: 0.65,
      rate: 0.94,
    });

    await service.speak('Segunda tentativa após inicialização do TTS.', 'masculina');
    expect(Speech.getAvailableVoicesAsync).toHaveBeenCalledTimes(2);
    expect(Speech.speak).toHaveBeenNthCalledWith(
      2,
      'Segunda tentativa após inicialização do TTS.',
      expect.objectContaining({
        language: 'pt-BR',
        pitch: 0.92,
        rate: 0.98,
        voice: 'pt-br-male-daniel',
      })
    );
  });
});
