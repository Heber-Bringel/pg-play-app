import { MemorySoundPreferenceDataSource } from '@/infra/datasources/memorySoundPreferenceDataSource';
import { MemoryHapticService } from '@/infra/services/memoryHapticService';
import { MemorySoundService } from '@/infra/services/memorySoundService';
import { GameFeedbackUseCases } from '@/usecase/gameFeedbackUseCases';

// Feedback tátil e sonoro do cronômetro, acerto, erro e passe (issues #77 e #84, specs 026 e 027).

async function runCountdown(
  useCases: GameFeedbackUseCases,
  from: number,
  reduceMotion: boolean
): Promise<void> {
  for (let seconds = from; seconds > 0; seconds -= 1) {
    await useCases.notifyTimerTick(seconds, seconds - 1, { reduceMotion });
  }
}

describe('GameFeedbackUseCases — vibração do cronômetro (#77)', () => {
  it('pulsa a cada segundo de 10 a 1 e vibra forte ao zerar', async () => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await runCountdown(useCases, 15, false);

    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 10, expired: 1 });
  });

  it('não vibra acima de 10 segundos', async () => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await useCases.notifyTimerTick(12, 11, { reduceMotion: false });
    await useCases.notifyTimerTick(11, 10, { reduceMotion: false });

    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 1, expired: 0 });
  });

  it('com "Reduzir movimento" não pulsa, mas mantém a vibração de tempo esgotado', async () => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await runCountdown(useCases, 15, true);

    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 0, expired: 1 });
  });

  it.each([
    ['o turno reinicia (0 → 60)', 0, 60],
    ['o valor se repete (5 → 5)', 5, 5],
    ['o cronômetro pula segundos (12 → 8)', 12, 8],
    ['o cronômetro pula direto para 0 (3 → 0)', 3, 0],
  ])('não vibra quando %s', async (_caso, previous, current) => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await useCases.notifyTimerTick(previous, current, { reduceMotion: false });

    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 0, expired: 0 });
  });

  it('não interfere nos contadores de acerto e passe do Quem Sou Eu', async () => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await runCountdown(useCases, 3, false);

    expect(haptic.getCounts()).toEqual({ hits: 0, passes: 0 });
  });
});

describe('GameFeedbackUseCases — vibração de acerto e erro (#77)', () => {
  it('acerto vibra sucesso e erro vibra a notificação de erro', async () => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await useCases.notifyAnswer('correct');
    await useCases.notifyAnswer('wrong');
    await useCases.notifyAnswer('wrong');

    expect(haptic.getFeedbackCounts()).toEqual({
      hits: 1,
      pulses: 0,
      expired: 0,
      answersWrong: 2,
      lettersWrong: 0,
    });
  });

  it('letra errada vibra um toque curto e letra certa não vibra', async () => {
    const haptic = new MemoryHapticService();
    const useCases = new GameFeedbackUseCases(haptic);

    await useCases.notifyLetterGuess(true);
    await useCases.notifyLetterGuess(false);

    expect(haptic.getFeedbackCounts()).toEqual({
      hits: 0,
      pulses: 0,
      expired: 0,
      answersWrong: 0,
      lettersWrong: 1,
    });
  });
});

describe('GameFeedbackUseCases — sons de jogo e preferência de som (#84)', () => {
  it('toca bipe de alerta a cada segundo nos 10s finais (10s → 1s) e som de tempo esgotado em 0s', async () => {
    const haptic = new MemoryHapticService();
    const sound = new MemorySoundService();
    const pref = new MemorySoundPreferenceDataSource({ enabled: true });
    const useCases = new GameFeedbackUseCases(haptic, sound, pref);

    await runCountdown(useCases, 15, false);

    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 10, expired: 1 });
    expect(sound.getSoundCounts()).toEqual({
      correct: 0,
      wrong: 0,
      letterWrong: 0,
      pass: 0,
      timerCritical: 10,
      timerExpired: 1,
    });
  });

  it('toca os sons de acerto, erro, letra errada e passe quando o som está ligado', async () => {
    const haptic = new MemoryHapticService();
    const sound = new MemorySoundService();
    const pref = new MemorySoundPreferenceDataSource({ enabled: true });
    const useCases = new GameFeedbackUseCases(haptic, sound, pref);

    await useCases.notifyAnswer('correct');
    await useCases.notifyAnswer('wrong');
    await useCases.notifyLetterGuess(true);
    await useCases.notifyLetterGuess(false);
    await useCases.notifyPass();

    expect(sound.getSoundCounts()).toEqual({
      correct: 1,
      wrong: 1,
      letterWrong: 1,
      pass: 1,
      timerCritical: 0,
      timerExpired: 0,
    });
    expect(haptic.getCounts()).toEqual({ hits: 1, passes: 1 });
  });

  it('com o som desligado (enabled: false), continua vibrando mas não reproduz nenhum som', async () => {
    const haptic = new MemoryHapticService();
    const sound = new MemorySoundService();
    const pref = new MemorySoundPreferenceDataSource({ enabled: false });
    const useCases = new GameFeedbackUseCases(haptic, sound, pref);

    await useCases.notifyAnswer('correct');
    await useCases.notifyAnswer('wrong');
    await useCases.notifyLetterGuess(false);
    await useCases.notifyPass();
    await runCountdown(useCases, 12, false);

    expect(sound.getSoundCounts()).toEqual({
      correct: 0,
      wrong: 0,
      letterWrong: 0,
      pass: 0,
      timerCritical: 0,
      timerExpired: 0,
    });
    expect(haptic.getFeedbackCounts()).toEqual({
      hits: 1,
      pulses: 10,
      expired: 1,
      answersWrong: 1,
      lettersWrong: 1,
    });
    expect(haptic.getCounts()).toEqual({ hits: 1, passes: 1 });
  });
});
