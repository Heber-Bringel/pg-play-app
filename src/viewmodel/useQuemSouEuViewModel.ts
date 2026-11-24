import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  quemSouEuUseCases as defaultQuemSouEuUseCases,
  gameFeedbackUseCases,
} from '@/di/container';
import type {
  QuemSouEuCard,
  QuemSouEuCardResult,
  QuemSouEuDurationOption,
  QuemSouEuPack,
  QuemSouEuTurnOutcome,
} from '@/model/entities/quemSouEuCard';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IQuemSouEuUseCases } from '@/usecase/iQuemSouEuUseCases';
import type { IGameFeedbackUseCases } from '@/usecase/iGameFeedbackUseCases';

export const ALL_QUEM_SOU_EU_PACKS: QuemSouEuPack[] = [
  'Famosos',
  'Animais',
  'Filmes e Séries',
  'Desenhos e Animações',
  'Profissões',
  'Comidas',
  'Objetos do Dia a Dia',
  'Lugares do Mundo',
];

export const QUEM_SOU_EU_DURATION_OPTIONS: QuemSouEuDurationOption[] = [
  45, 60, 90,
];

export const QUEM_SOU_EU_ROUNDS_OPTIONS: number[] = [1, 2, 3, 4, 5];

const PREP_COUNTDOWN_SECONDS = 3;
const TILT_COOLDOWN_MS = 1000;
const FEEDBACK_DISPLAY_MS = 1000;

export type QuemSouEuPhase =
  'setup' | 'handoff' | 'countdown' | 'playing' | 'summary' | 'finished';

export type QuemSouEuFeedback = {
  outcome: QuemSouEuTurnOutcome;
  seq: number;
};

export type QuemSouEuState = {
  reduceMotion: boolean;
  loading: boolean;
  error: string | null;
  phase: QuemSouEuPhase;
  teams: Team[];
  selectedPacks: QuemSouEuPack[];
  durationSeconds: QuemSouEuDurationOption;
  roundsPerTeam: number;
  tiltEnabled: boolean;
  tiltAvailable: boolean;
  cards: QuemSouEuCard[];
  currentCardIndex: number;
  currentCard: QuemSouEuCard | null;
  turnIndex: number;
  totalTurns: number;
  currentRound: number;
  currentTeam: Team | null;
  countdownSeconds: number;
  secondsRemaining: number;
  turnResults: QuemSouEuCardResult[];
  turnPoints: number;
  lastFeedback: QuemSouEuFeedback | null;
  deckExhausted: boolean;
  sessionScoresByTeamId: Record<string, number>;
  exitConfirmVisible: boolean;
};

export type QuemSouEuActions = {
  setReduceMotion: (enabled: boolean) => void;
  reloadTeams: () => Promise<void>;
  togglePack: (pack: QuemSouEuPack) => void;
  selectDuration: (seconds: QuemSouEuDurationOption) => void;
  selectRoundsPerTeam: (count: number) => void;
  toggleTiltEnabled: () => void;
  setTiltEnabled: (enabled: boolean) => void;
  startMatch: () => Promise<void>;
  startTurn: () => void;
  registerHit: () => void;
  registerPass: () => void;
  nextTurn: () => Promise<void>;
  restartMatch: () => void;
  requestExit: () => void;
  cancelExit: () => void;
  confirmExit: () => void;
  goToTeams: () => void;
  goToScoreboard: () => void;
};

function sumTurnPoints(results: QuemSouEuCardResult[]): number {
  return results.reduce((acc, item) => acc + item.pointsAwarded, 0);
}

export function useQuemSouEuViewModel(
  useCase: IQuemSouEuUseCases = defaultQuemSouEuUseCases,
  gameFeedback: IGameFeedbackUseCases = gameFeedbackUseCases
): [QuemSouEuState, QuemSouEuActions] {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<QuemSouEuPhase>('setup');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<QuemSouEuPack[]>(
    ALL_QUEM_SOU_EU_PACKS
  );
  const [durationSeconds, setDurationSeconds] =
    useState<QuemSouEuDurationOption>(60);
  const [roundsPerTeam, setRoundsPerTeam] = useState<number>(2);
  const [tiltEnabled, setTiltEnabled] = useState<boolean>(true);
  const [tiltAvailable, setTiltAvailable] = useState<boolean>(true);
  const [cards, setCards] = useState<QuemSouEuCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    PREP_COUNTDOWN_SECONDS
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);

  // Feedback tátil do cronômetro (issue #77): a regra de quando vibrar fica
  // no GameFeedbackUseCases; aqui só informamos o segundo anterior e o atual.
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const previousSecondsRef = useRef<number>(secondsRemaining);

  useEffect(() => {
    const previousSeconds = previousSecondsRef.current;
    previousSecondsRef.current = secondsRemaining;
    // Mudar só o reduceMotion repete o mesmo segundo, e o UseCase ignora.
    void gameFeedback.notifyTimerTick(previousSeconds, secondsRemaining, {
      reduceMotion,
    });
  }, [secondsRemaining, reduceMotion, gameFeedback]);

  const setReduceMotionValue = useCallback((enabled: boolean) => {
    setReduceMotionState(enabled);
  }, []);
  const [turnResults, setTurnResults] = useState<QuemSouEuCardResult[]>([]);
  const [lastFeedback, setLastFeedback] = useState<QuemSouEuFeedback | null>(
    null
  );
  const [deckExhausted, setDeckExhausted] = useState<boolean>(false);
  const [sessionScoresByTeamId, setSessionScoresByTeamId] = useState<
    Record<string, number>
  >({});
  const [exitConfirmVisible, setExitConfirmVisible] = useState<boolean>(false);

  const feedbackSeqRef = useRef<number>(0);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardIndexRef = useRef<number>(0);

  const updateCardIndex = useCallback((index: number) => {
    cardIndexRef.current = index;
    setCurrentCardIndex(index);
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimeoutRef.current !== null) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
      void useCase.unlockOrientation();
    };
  }, [clearFeedbackTimer, useCase]);

  // Trava em modo paisagem assim que a partida inicia (handoff em diante) e destrava no setup
  useEffect(() => {
    if (phase === 'setup') {
      void useCase.unlockOrientation();
    } else {
      void useCase.lockLandscape();
    }
  }, [phase, useCase]);

  const reloadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedTeams, sensorAvailable] = await Promise.all([
        useCase.listTeams(),
        useCase.isTiltSensorAvailable(),
      ]);
      setTeams(loadedTeams);
      setTiltAvailable(sensorAvailable);
      // Sem sensor, o único modo possível é Botões
      if (!sensorAvailable) {
        setTiltEnabled(false);
      }
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar as equipes.');
      }
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => {
    void reloadTeams();
  }, [reloadTeams]);

  const currentCard = cards[currentCardIndex] ?? null;
  const currentTeam = teams.length > 0 ? teams[turnIndex % teams.length] : null;
  const totalTurns = teams.length * roundsPerTeam;
  const currentRound =
    teams.length > 0 ? Math.floor(turnIndex / teams.length) + 1 : 1;
  const turnPoints = sumTurnPoints(turnResults);

  const registerOutcome = useCallback(
    (outcome: QuemSouEuTurnOutcome) => {
      if (phase !== 'playing' || exitConfirmVisible) {
        return;
      }

      // Enquanto o feedback da carta anterior está na tela, novos gestos e
      // toques são ignorados: a carta respondida continua visível até o fim.
      if (feedbackTimeoutRef.current !== null) {
        return;
      }

      const cardIdx = cardIndexRef.current;
      const card = cards[cardIdx];
      if (!card) {
        return;
      }

      const result = useCase.recordCardOutcome(card, outcome);
      setTurnResults((prev) => [...prev, result]);

      feedbackSeqRef.current += 1;
      setLastFeedback({ outcome, seq: feedbackSeqRef.current });

      // Só troca para a próxima carta depois de exibir o feedback sobre a
      // carta que acabou de ser acertada/passada.
      const totalCards = cards.length;
      feedbackTimeoutRef.current = setTimeout(() => {
        feedbackTimeoutRef.current = null;
        setLastFeedback(null);
        const nextCardIdx = cardIdx + 1;
        updateCardIndex(nextCardIdx);
        if (nextCardIdx >= totalCards) {
          setDeckExhausted(true);
          setPhase('summary');
        }
      }, FEEDBACK_DISPLAY_MS);
    },
    [cards, exitConfirmVisible, phase, updateCardIndex, useCase]
  );

  // Mantém sempre a versão mais recente de registerOutcome acessível ao
  // listener do sensor, sem precisar recriar a inscrição a cada carta.
  const registerOutcomeRef = useRef(registerOutcome);
  useEffect(() => {
    registerOutcomeRef.current = registerOutcome;
  }, [registerOutcome]);

  // Contagem regressiva de 3 segundos antes do turno começar (RF32)
  useEffect(() => {
    if (phase !== 'countdown' || exitConfirmVisible) {
      return;
    }

    if (countdownSeconds <= 0) {
      setSecondsRemaining(durationSeconds);
      setPhase('playing');
      return;
    }

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds, durationSeconds, exitConfirmVisible, phase]);

  // Cronômetro principal do turno (RF10). O intervalo não depende da carta
  // atual, para que responder cartas não reinicie a contagem do segundo.
  useEffect(() => {
    if (phase !== 'playing' || exitConfirmVisible) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [exitConfirmVisible, phase]);

  // Fim do tempo: a carta atual é descartada sem pontuar (RF34). Se o tempo
  // acabar durante o feedback, a carta já respondida é apenas finalizada.
  useEffect(() => {
    if (phase !== 'playing' || exitConfirmVisible || secondsRemaining > 0) {
      return;
    }

    clearFeedbackTimer();
    setLastFeedback(null);
    const cardIdx = cardIndexRef.current;
    if (cardIdx < cards.length) {
      const nextCardIdx = cardIdx + 1;
      updateCardIndex(nextCardIdx);
      if (nextCardIdx >= cards.length) {
        setDeckExhausted(true);
      }
    }
    setPhase('summary');
  }, [
    cards.length,
    clearFeedbackTimer,
    exitConfirmVisible,
    phase,
    secondsRemaining,
    updateCardIndex,
  ]);

  // Assinatura do sensor de inclinação: uma única inscrição por turno ativo
  // (RF33). Recriar a inscrição a cada carta zerava o cooldown e a exigência
  // de voltar à posição neutra, fazendo um único gesto pular várias cartas.
  useEffect(() => {
    if (phase !== 'playing' || !tiltEnabled || exitConfirmVisible) {
      return;
    }

    const unsubscribe = useCase.subscribeTiltSensor((gesture) => {
      registerOutcomeRef.current(gesture);
    }, TILT_COOLDOWN_MS);

    return () => {
      unsubscribe();
    };
  }, [exitConfirmVisible, phase, tiltEnabled, useCase]);

  const togglePack = useCallback((pack: QuemSouEuPack) => {
    setError(null);
    setSelectedPacks((prev) =>
      prev.includes(pack)
        ? prev.filter((item) => item !== pack)
        : [...prev, pack]
    );
  }, []);

  const selectDuration = useCallback((seconds: QuemSouEuDurationOption) => {
    setError(null);
    setDurationSeconds(seconds);
  }, []);

  const selectRoundsPerTeam = useCallback((count: number) => {
    setError(null);
    setRoundsPerTeam(count);
  }, []);

  const toggleTiltEnabled = useCallback(() => {
    setError(null);
    setTiltEnabled((prev) => !prev);
  }, []);

  const setTiltEnabledValue = useCallback((enabled: boolean) => {
    setError(null);
    setTiltEnabled(enabled);
  }, []);

  const startMatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prepared = await useCase.prepareMatch({
        packs: selectedPacks,
        durationSeconds,
        roundsPerTeam,
        tiltEnabled,
      });

      const initialScores: Record<string, number> = {};
      for (const team of prepared.teams) {
        initialScores[team.id] = 0;
      }

      clearFeedbackTimer();
      setTeams(prepared.teams);
      setCards(prepared.cards);
      updateCardIndex(0);
      setTurnIndex(0);
      setTurnResults([]);
      setLastFeedback(null);
      setDeckExhausted(false);
      setSessionScoresByTeamId(initialScores);
      setCountdownSeconds(PREP_COUNTDOWN_SECONDS);
      setSecondsRemaining(prepared.config.durationSeconds);
      setPhase('handoff');
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a partida de Quem Sou Eu?.');
      }
    } finally {
      setLoading(false);
    }
  }, [
    clearFeedbackTimer,
    durationSeconds,
    roundsPerTeam,
    selectedPacks,
    tiltEnabled,
    updateCardIndex,
    useCase,
  ]);

  const startTurn = useCallback(() => {
    if (phase !== 'handoff') {
      return;
    }
    setError(null);
    setTurnResults([]);
    setLastFeedback(null);
    setCountdownSeconds(PREP_COUNTDOWN_SECONDS);
    setPhase('countdown');
  }, [phase]);

  const registerHit = useCallback(() => {
    registerOutcome('hit');
  }, [registerOutcome]);

  const registerPass = useCallback(() => {
    registerOutcome('pass');
  }, [registerOutcome]);

  const nextTurn = useCallback(async () => {
    if (phase !== 'summary') {
      return;
    }

    setError(null);
    const pointsToRecord = sumTurnPoints(turnResults);

    try {
      if (currentTeam && pointsToRecord > 0) {
        await useCase.recordTeamScore(currentTeam.id, pointsToRecord);
        setSessionScoresByTeamId((prev) => ({
          ...prev,
          [currentTeam.id]: (prev[currentTeam.id] ?? 0) + pointsToRecord,
        }));
      }

      clearFeedbackTimer();
      setLastFeedback(null);

      const nextTurnIdx = turnIndex + 1;
      const noMoreCards = deckExhausted || currentCardIndex >= cards.length;
      const allTurnsCompleted = nextTurnIdx >= totalTurns;

      if (noMoreCards || allTurnsCompleted) {
        if (noMoreCards) {
          setDeckExhausted(true);
        }
        setPhase('finished');
        return;
      }

      setTurnIndex(nextTurnIdx);
      setTurnResults([]);
      setCountdownSeconds(PREP_COUNTDOWN_SECONDS);
      setSecondsRemaining(durationSeconds);
      setPhase('handoff');
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível registrar os pontos no placar.');
      }
    }
  }, [
    cards.length,
    clearFeedbackTimer,
    currentCardIndex,
    currentTeam,
    deckExhausted,
    durationSeconds,
    phase,
    totalTurns,
    turnIndex,
    turnResults,
    useCase,
  ]);

  const restartMatch = useCallback(() => {
    clearFeedbackTimer();
    setError(null);
    setTurnResults([]);
    setLastFeedback(null);
    setDeckExhausted(false);
    setTurnIndex(0);
    updateCardIndex(0);
    setPhase('setup');
  }, [clearFeedbackTimer, updateCardIndex]);

  const requestExit = useCallback(() => {
    if (phase === 'setup' || phase === 'finished') {
      void useCase.unlockOrientation();
      router.dismissTo('/');
      return;
    }
    setExitConfirmVisible(true);
  }, [phase, router, useCase]);

  const cancelExit = useCallback(() => {
    setExitConfirmVisible(false);
  }, []);

  const confirmExit = useCallback(() => {
    clearFeedbackTimer();
    setExitConfirmVisible(false);
    void useCase.unlockOrientation();
    router.dismissTo('/');
  }, [clearFeedbackTimer, router, useCase]);

  const goToTeams = useCallback(() => {
    void useCase.unlockOrientation();
    router.push('/teams');
  }, [router, useCase]);

  const goToScoreboard = useCallback(() => {
    void useCase.unlockOrientation();
    router.replace('/scoreboard');
  }, [router, useCase]);

  return [
    {
      reduceMotion,
      loading,
      error,
      phase,
      teams,
      selectedPacks,
      durationSeconds,
      roundsPerTeam,
      tiltEnabled,
      tiltAvailable,
      cards,
      currentCardIndex,
      currentCard,
      turnIndex,
      totalTurns,
      currentRound,
      currentTeam,
      countdownSeconds,
      secondsRemaining,
      turnResults,
      turnPoints,
      lastFeedback,
      deckExhausted,
      sessionScoresByTeamId,
      exitConfirmVisible,
    },
    {
      setReduceMotion: setReduceMotionValue,
      reloadTeams,
      togglePack,
      selectDuration,
      selectRoundsPerTeam,
      toggleTiltEnabled,
      setTiltEnabled: setTiltEnabledValue,
      startMatch,
      startTurn,
      registerHit,
      registerPass,
      nextTurn,
      restartMatch,
      requestExit,
      cancelExit,
      confirmExit,
      goToTeams,
      goToScoreboard,
    },
  ];
}
