import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMatchSettingsDataSource } from '@/infra/datasources/memoryMatchSettingsDataSource';
import { MemoryQuemSouEuDataSource } from '@/infra/datasources/memoryQuemSouEuDataSource';
import { MemoryTeamDataSource } from '@/infra/datasources/memoryTeamDataSource';
import { MemoryVerseDataSource } from '@/infra/datasources/memoryVerseDataSource';
import { MemorySoundPreferenceDataSource } from '@/infra/datasources/memorySoundPreferenceDataSource';
import { MemoryHapticService } from '@/infra/services/memoryHapticService';
import { MemorySoundService } from '@/infra/services/memorySoundService';
import { MemoryScreenOrientationService } from '@/infra/services/memoryScreenOrientationService';
import { MemoryTiltSensorService } from '@/infra/services/memoryTiltSensorService';
import { PgPlayUseCases } from '@/usecase/pgPlayUseCases';
import { QuemSouEuUseCases } from '@/usecase/quemSouEuUseCases';
import { GameFeedbackUseCases } from '@/usecase/gameFeedbackUseCases';
import { VersiculoUseCases } from '@/usecase/versiculoUseCases';
import { useForcaViewModel } from '@/viewmodel/useForcaViewModel';
import { useMimicaViewModel } from '@/viewmodel/useMimicaViewModel';
import { useQuemSouEuViewModel } from '@/viewmodel/useQuemSouEuViewModel';
import { useQuizViewModel } from '@/viewmodel/useQuizViewModel';
import { useVersiculoViewModel } from '@/viewmodel/useVersiculoViewModel';

// Feedback tátil nas ViewModels (issue #77, spec 026): cronômetro dos 4 jogos
// de 1 celular e acerto/erro no Quiz, na Forca e no Versículo.
// Usa o GameFeedbackUseCases real com MemoryHapticService.

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
    back: jest.fn(),
  }),
}));

type HookResult = readonly [object, unknown];

function renderHook<T extends HookResult>(useHook: () => T) {
  let latest!: T;
  const Host = () => {
    latest = useHook();
    return null;
  };
  let tree!: renderer.ReactTestRenderer;
  return {
    get state() {
      return latest[0] as T[0];
    },
    get actions() {
      return latest[1] as T[1];
    },
    mount: async () => {
      await act(async () => {
        tree = renderer.create(React.createElement(Host));
      });
    },
    unmount: () => {
      act(() => {
        tree.unmount();
      });
    },
  };
}

function advanceSeconds(seconds: number) {
  for (let i = 0; i < seconds; i += 1) {
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

function buildFeedback(soundEnabled = true) {
  const haptic = new MemoryHapticService();
  const sound = new MemorySoundService();
  const soundPref = new MemorySoundPreferenceDataSource({
    enabled: soundEnabled,
  });
  return {
    haptic,
    sound,
    soundPref,
    feedback: new GameFeedbackUseCases(haptic, sound, soundPref),
  };
}

function buildPgPlay() {
  return new PgPlayUseCases(
    new MemoryTeamDataSource(),
    new MemoryGameCatalogDataSource(),
    new MemoryMatchSettingsDataSource()
  );
}

function twoTeams() {
  return new MemoryTeamDataSource([
    { id: 't1', name: 'Alfa', score: 0 },
    { id: 't2', name: 'Beta', score: 0 },
  ]);
}

// Mantém a ordem determinística dos puzzles da Forca após o embaralhamento shufflePuzzles (RF28/RF30).
const IDENTITY_RANDOM_FN = () => 0.999999;

describe('Feedback tátil do cronômetro nas ViewModels (#77)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Mímica: 10 pulsos táteis e 10 ticks sonoros nos segundos finais e 1 aviso ao zerar (#77, #92)', async () => {
    const { haptic, sound, feedback } = buildFeedback();
    const useCases = buildPgPlay();
    const hook = renderHook(() => useMimicaViewModel(useCases, feedback));
    await hook.mount();

    act(() => {
      hook.actions.handleStartTurn();
    });
    const duration = hook.state.secondsRemaining;
    for (let i = 0; i < duration; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(hook.state.secondsRemaining).toBe(0);
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 10, expired: 1 });
    expect(sound.getSoundCounts()).toMatchObject({
      timerTick: 10,
      timerExpired: 1,
    });
    hook.unmount();
  });

  it('Quiz: 10 pulsos e 1 vibração forte; com "Reduzir movimento", só a forte', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCases = buildPgPlay();
    const hook = renderHook(() => useQuizViewModel(useCases, feedback));
    await hook.mount();

    act(() => {
      hook.actions.handleSetReduceMotion(true);
    });
    expect(hook.state.reduceMotion).toBe(true);

    act(() => {
      hook.actions.handleStartTurn();
    });
    advanceSeconds(hook.state.secondsRemaining);

    expect(hook.state.secondsRemaining).toBe(0);
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 0, expired: 1 });
    hook.unmount();
  });

  it('Quem Sou Eu: vibra só no cronômetro do turno, não na contagem 3-2-1', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCase = new QuemSouEuUseCases(
      new MemoryQuemSouEuDataSource(),
      twoTeams(),
      new MemoryTiltSensorService(true, () => 10000),
      new MemoryScreenOrientationService()
    );
    const hook = renderHook(() => useQuemSouEuViewModel(useCase, feedback));
    await hook.mount();

    act(() => {
      hook.actions.selectDuration(45);
      hook.actions.selectRoundsPerTeam(1);
    });
    await act(async () => {
      await hook.actions.startMatch();
    });
    act(() => {
      hook.actions.startTurn();
    });
    advanceSeconds(3); // contagem inicial 3-2-1
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 0, expired: 0 });

    advanceSeconds(45);

    expect(hook.state.secondsRemaining).toBe(0);
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 10, expired: 1 });
    hook.unmount();
  });

  it('Complete o Versículo: 10 pulsos e 1 vibração forte; responder antes não vibra forte', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCase = new VersiculoUseCases(new MemoryVerseDataSource(), twoTeams());
    const hook = renderHook(() => useVersiculoViewModel(useCase, feedback));
    await hook.mount();

    act(() => {
      hook.actions.selectDuration(30);
      hook.actions.selectPassagesPerTeam(1);
    });
    await act(async () => {
      await hook.actions.startMatch();
    });

    // 1º turno: responde aos 25 s, sem vibração.
    act(() => {
      hook.actions.startTurn();
    });
    advanceSeconds(5);
    act(() => {
      hook.actions.submitAnswers();
    });
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 0, expired: 0 });

    // 2º turno: deixa o tempo acabar.
    await act(async () => {
      await hook.actions.nextTurn();
    });
    act(() => {
      hook.actions.startTurn();
    });
    advanceSeconds(30);

    expect(hook.state.secondsRemaining).toBe(0);
    expect(haptic.getFeedbackCounts()).toMatchObject({ pulses: 10, expired: 1 });
    hook.unmount();
  });
});

describe('Vibração de acerto e erro nas ViewModels (#77)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Quiz: acerto vibra sucesso, erro vibra erro e tempo esgotado não vibra erro junto', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCases = buildPgPlay();
    const hook = renderHook(() => useQuizViewModel(useCases, feedback));
    await hook.mount();

    // 1ª pergunta: alternativa correta.
    act(() => {
      hook.actions.handleStartTurn();
    });
    const correctKey = hook.state.currentQuestion!.correctKey;
    await act(async () => {
      await hook.actions.handleSelectOption(correctKey);
    });
    expect(haptic.getFeedbackCounts()).toMatchObject({ hits: 1, answersWrong: 0 });

    // 2ª pergunta: alternativa errada.
    act(() => {
      hook.actions.handleNextQuestion();
    });
    act(() => {
      hook.actions.handleStartTurn();
    });
    const wrongKey = hook.state.currentQuestion!.options.find(
      (option) => option.key !== hook.state.currentQuestion!.correctKey
    )!.key;
    await act(async () => {
      await hook.actions.handleSelectOption(wrongKey);
    });
    expect(haptic.getFeedbackCounts()).toMatchObject({ hits: 1, answersWrong: 1 });

    // 3ª pergunta: o tempo acaba sem resposta.
    act(() => {
      hook.actions.handleNextQuestion();
    });
    act(() => {
      hook.actions.handleStartTurn();
    });
    advanceSeconds(hook.state.secondsRemaining);

    expect(hook.state.phase).toBe('answered');
    expect(haptic.getFeedbackCounts()).toMatchObject({
      hits: 1,
      answersWrong: 1,
      expired: 1,
    });
    hook.unmount();
  });

  it('Forca: letra certa não vibra, letra errada vibra curto e palavra completa vibra sucesso', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCases = buildPgPlay();
    const hook = renderHook(() => useForcaViewModel(useCases, feedback, IDENTITY_RANDOM_FN));
    await hook.mount();

    act(() => {
      hook.actions.handleStartTurn();
    });
    expect(hook.state.currentPuzzle?.word).toBe('COMUNHÃO');

    await act(async () => {
      await hook.actions.handleGuessLetter('C');
    });
    expect(haptic.getFeedbackCounts()).toEqual({
      hits: 0,
      pulses: 0,
      expired: 0,
      answersWrong: 0,
      lettersWrong: 0,
    });

    await act(async () => {
      await hook.actions.handleGuessLetter('Z');
    });
    expect(haptic.getFeedbackCounts()).toMatchObject({ lettersWrong: 1 });

    for (const letter of ['O', 'M', 'U', 'N', 'H', 'A']) {
      await act(async () => {
        await hook.actions.handleGuessLetter(letter);
      });
    }

    expect(hook.state.wordWon).toBe(true);
    expect(haptic.getFeedbackCounts()).toEqual({
      hits: 1,
      pulses: 0,
      expired: 0,
      answersWrong: 0,
      lettersWrong: 1,
    });
    hook.unmount();
  });

  it('Forca: a última tentativa vibra só o erro, sem o toque curto junto', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCases = buildPgPlay();
    const hook = renderHook(() => useForcaViewModel(useCases, feedback, IDENTITY_RANDOM_FN));
    await hook.mount();

    act(() => {
      hook.actions.handleStartTurn();
    });
    const attempts = hook.state.remainingAttempts;
    const wrongLetters = ['B', 'D', 'E', 'F', 'G', 'I', 'J', 'K'].slice(0, attempts);
    for (const letter of wrongLetters) {
      await act(async () => {
        await hook.actions.handleGuessLetter(letter);
      });
    }

    expect(hook.state.wordLost).toBe(true);
    expect(haptic.getFeedbackCounts()).toMatchObject({
      hits: 0,
      lettersWrong: attempts - 1,
      answersWrong: 1,
    });
    hook.unmount();
  });

  it('Complete o Versículo: envio certo vibra sucesso, envio errado vibra erro e tempo esgotado só o esgotado', async () => {
    const { haptic, feedback } = buildFeedback();
    const useCase = new VersiculoUseCases(new MemoryVerseDataSource(), twoTeams());
    const hook = renderHook(() => useVersiculoViewModel(useCase, feedback));
    await hook.mount();

    act(() => {
      hook.actions.selectDuration(30);
      hook.actions.selectPassagesPerTeam(2);
    });
    await act(async () => {
      await hook.actions.startMatch();
    });

    // 1º turno: todas as lacunas certas.
    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      for (const blank of hook.state.currentPassage!.blanks) {
        hook.actions.setAnswer(blank.index, blank.answer);
      }
    });
    act(() => {
      hook.actions.submitAnswers();
    });
    expect(hook.state.results.every((result) => result.isCorrect)).toBe(true);
    expect(haptic.getFeedbackCounts()).toMatchObject({ hits: 1, answersWrong: 0 });

    // 2º turno: envia sem preencher (lacunas erradas).
    await act(async () => {
      await hook.actions.nextTurn();
    });
    act(() => {
      hook.actions.startTurn();
    });
    act(() => {
      hook.actions.submitAnswers();
    });
    expect(haptic.getFeedbackCounts()).toMatchObject({ hits: 1, answersWrong: 1 });

    // 3º turno: o tempo acaba.
    await act(async () => {
      await hook.actions.nextTurn();
    });
    act(() => {
      hook.actions.startTurn();
    });
    advanceSeconds(30);

    expect(haptic.getFeedbackCounts()).toMatchObject({
      hits: 1,
      answersWrong: 1,
      expired: 1,
    });
    hook.unmount();
  });

  it('Mímica e Quem Sou Eu: acerto toca playCorrect, pular/passar toca playPass e alerta de 10s toca uma vez (#84)', async () => {
    const { haptic, sound, feedback } = buildFeedback(true);
    const pgPlay = buildPgPlay();
    const mimicaHook = renderHook(() => useMimicaViewModel(pgPlay, feedback));
    await mimicaHook.mount();

    act(() => {
      mimicaHook.actions.handleStartTurn();
    });
    await act(async () => {
      await mimicaHook.actions.handleHit();
      await mimicaHook.actions.handleSkip();
    });

    expect(sound.getSoundCounts()).toMatchObject({
      correct: 1,
      pass: 1,
    });

    const quemSouEuUc = new QuemSouEuUseCases(
      new MemoryQuemSouEuDataSource(),
      twoTeams(),
      new MemoryTiltSensorService(true, () => 10000),
      new MemoryScreenOrientationService()
    );
    const qseHook = renderHook(() =>
      useQuemSouEuViewModel(quemSouEuUc, feedback)
    );
    await qseHook.mount();

    await act(async () => {
      await qseHook.actions.startMatch();
    });
    act(() => {
      qseHook.actions.startTurn();
    });
    advanceSeconds(3);

    await act(async () => {
      qseHook.actions.registerHit();
    });
    advanceSeconds(1);
    await act(async () => {
      qseHook.actions.registerPass();
    });

    expect(sound.getSoundCounts()).toMatchObject({
      correct: 2,
      pass: 2,
    });
    expect(haptic.getCounts()).toEqual({ hits: 2, passes: 2 });

    mimicaHook.unmount();
    qseHook.unmount();
  });
});
