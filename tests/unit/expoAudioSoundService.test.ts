import * as ExpoAudio from 'expo-audio';
import {
  ExpoAudioSoundService,
  type SoundSourcesMap,
} from '@/infra/services/expoAudioSoundService';

const createAudioPlayer = ExpoAudio.createAudioPlayer as jest.Mock;
const preload = ExpoAudio.preload as jest.Mock;
const setAudioModeAsync = ExpoAudio.setAudioModeAsync as jest.Mock;

const TEST_SOURCES: SoundSourcesMap = {
  correct: 'src-correct',
  wrong: 'src-wrong',
  letterWrong: 'src-letter-wrong',
  pass: 'src-pass',
  timerCritical: 'src-timer-critical',
  timerExpired: 'src-timer-expired',
};

describe('ExpoAudioSoundService (#84)', () => {
  beforeEach(() => {
    createAudioPlayer.mockClear();
    preload.mockClear();
    setAudioModeAsync.mockClear();
  });

  it('pré-carrega os 6 sons, configura modo silencioso do iOS e reproduz cada efeito', async () => {
    const service = new ExpoAudioSoundService(TEST_SOURCES);
    await Promise.resolve();
    await Promise.resolve();

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
      })
    );
    expect(preload).toHaveBeenCalledTimes(6);
    expect(createAudioPlayer).toHaveBeenCalledTimes(6);

    await service.playCorrect();
    await service.playWrong();
    await service.playLetterWrong();
    await service.playPass();
    await service.playTimerCritical();
    await service.playTimerExpired();

    const players = createAudioPlayer.mock.results.map((r) => r.value);
    for (const player of players) {
      expect(player.seekTo).toHaveBeenCalledWith(0);
      expect(player.play).toHaveBeenCalledTimes(1);
    }
  });

  it('degrada silenciosamente sem lançar exceção quando expo-audio falha', async () => {
    setAudioModeAsync.mockRejectedValue(new Error('sem suporte a áudio'));
    preload.mockRejectedValue(new Error('falha no preload'));
    createAudioPlayer.mockImplementationOnce(() => {
      throw new Error('falha ao criar player');
    });

    const service = new ExpoAudioSoundService(TEST_SOURCES);

    await expect(service.playCorrect()).resolves.toBeUndefined();
    await expect(service.playWrong()).resolves.toBeUndefined();
    await expect(service.playLetterWrong()).resolves.toBeUndefined();
    await expect(service.playPass()).resolves.toBeUndefined();
    await expect(service.playTimerCritical()).resolves.toBeUndefined();
    await expect(service.playTimerExpired()).resolves.toBeUndefined();
  });
});
