import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases, gameFeedbackUseCases } from '@/di/container';
import type { MimicaCard, MimicaCategory } from '@/model/entities/arenaChallenge';
import {
  DEFAULT_MATCH_SETTINGS,
  type MatchSettings,
  type MimicaDurationOption,
} from '@/model/entities/matchSettings';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';
import type { IGameFeedbackUseCases } from '@/usecase/iGameFeedbackUseCases';

export type MimicaPhase = 'pass-turn' | 'playing' | 'turn-summary' | 'finished';

export type { MimicaDurationOption } from '@/model/entities/matchSettings';

export const ALL_MIMICA_CATEGORIES: MimicaCategory[] = [
  'Bíblico',
  'Filmes e Séries',
  'Animais',
  'Profissões',
  'Esportes',
  'Ações do Dia a Dia',
  'Cultura Pop',
];

export type MimicaState = {
  reduceMotion: boolean;
  phase: MimicaPhase;
  teams: Team[];
  currentTeamIndex: number;
  currentTeam: Team | null;
  currentRound: number;
  totalRounds: number;
  isLastTurn: boolean;
  turnDurationSeconds: MimicaDurationOption;
  secondsRemaining: number;
  selectedCategories: MimicaCategory[];
  currentCard: MimicaCard | null;
  remainingCardsCount: number;
  wordVisible: boolean;
  turnHits: number;
  turnSkips: number;
  turnPointsDelta: number;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
  categoryWarning: string | null;
};

export type MimicaActions = {
  handleSetReduceMotion: (enabled: boolean) => void;
  handleStartTurn: () => void;
  handleToggleWordVisibility: () => void;
  handleHit: () => Promise<void>;
  handleSkip: () => Promise<void>;
  handleTick: () => void;
  handleNextTurn: () => void;
  handleSelectDuration: (seconds: MimicaDurationOption) => Promise<void>;
  handleSelectRounds: (rounds: number) => Promise<void>;
  handleToggleCategory: (category: MimicaCategory) => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => void;
  handleGoToTeams: () => void;
  handleGoToScoreboard: () => void;
  handleRetry: () => Promise<void>;
};

export function useMimicaViewModel(
  useCases: IPgPlayUseCases = pgPlayUseCases,
  gameFeedback: IGameFeedbackUseCases = gameFeedbackUseCases
): [MimicaState, MimicaActions] {
  const router = useRouter();

  const [phase, setPhase] = useState<MimicaPhase>('pass-turn');
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(
    DEFAULT_MATCH_SETTINGS.mimica.totalRounds
  );
  const [turnDurationSeconds, setTurnDurationSeconds] = useState<MimicaDurationOption>(
    DEFAULT_MATCH_SETTINGS.mimica.durationSeconds
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    DEFAULT_MATCH_SETTINGS.mimica.durationSeconds
  );

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

  const handleSetReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotionState(enabled);
  }, []);
  const [selectedCategories, setSelectedCategories] = useState<MimicaCategory[]>(ALL_MIMICA_CATEGORIES);
  const [freshDeck, setFreshDeck] = useState<MimicaCard[]>([]);
  const [skippedDeck, setSkippedDeck] = useState<MimicaCard[]>([]);
  const [wordVisible, setWordVisible] = useState<boolean>(true);
  const [turnHits, setTurnHits] = useState<number>(0);
  const [turnSkips, setTurnSkips] = useState<number>(0);
  const [turnPointsDelta, setTurnPointsDelta] = useState<number>(0);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  const loadSession = useCallback(
    async (categoriesToLoad: MimicaCategory[]) => {
      setLoading(true);
      setError(null);
      setCategoryWarning(null);
      try {
        const [loadedTeams, loadedCards, settings] = await Promise.all([
          useCases.listTeams(),
          useCases.listMimicaCards(categoriesToLoad),
          useCases.getMatchSettings(),
        ]);
        setTeams(loadedTeams);
        setFreshDeck(loadedCards);
        setSkippedDeck([]);
        setTotalRounds(settings.mimica.totalRounds);
        setTurnDurationSeconds(settings.mimica.durationSeconds);
        setSecondsRemaining(settings.mimica.durationSeconds);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível carregar a Arena de Mímica Expressiva.');
        }
      } finally {
        setLoading(false);
      }
    },
    [useCases]
  );

  useEffect(() => {
    void loadSession(ALL_MIMICA_CATEGORIES);
  }, [loadSession]);

  const currentCard: MimicaCard | null =
    freshDeck.length > 0
      ? freshDeck[0]
      : skippedDeck.length > 0
      ? skippedDeck[0]
      : null;

  const remainingCardsCount = freshDeck.length + skippedDeck.length;
  const currentTeam: Team | null = teams[currentTeamIndex] ?? null;
  const isLastTurn =
    remainingCardsCount === 0 ||
    (currentTeamIndex + 1 >= teams.length && currentRound >= totalRounds);

  const handleTick = useCallback(() => {
    setSecondsRemaining((prev) => {
      if (prev <= 1) {
        setPhase('turn-summary');
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    // O cronômetro pausa enquanto a confirmação de saída está aberta.
    if (phase !== 'playing' || confirmingExit) {
      return undefined;
    }
    const timerId = setInterval(() => {
      handleTick();
    }, 1000);
    return () => clearInterval(timerId);
  }, [phase, confirmingExit, handleTick]);

  const handleStartTurn = useCallback(() => {
    if (!currentTeam) {
      setError('Cadastre pelo menos 2 equipes antes de iniciar a rodada.');
      return;
    }
    if (!currentCard) {
      setPhase('finished');
      return;
    }
    setError(null);
    setCategoryWarning(null);
    setWordVisible(true);
    setTurnHits(0);
    setTurnSkips(0);
    setTurnPointsDelta(0);
    setSecondsRemaining(turnDurationSeconds);
    setPhase('playing');
  }, [currentTeam, currentCard, turnDurationSeconds]);

  const handleToggleWordVisibility = useCallback(() => {
    setWordVisible((prev) => !prev);
  }, []);

  const handleHit = useCallback(async () => {
    if (phase !== 'playing' || !currentTeam || !currentCard) {
      return;
    }
    try {
      setError(null);
      const oldScore = currentTeam.score;
      const updatedTeams = await useCases.scoreMimicaHit(
        currentTeam.id,
        currentCard.points
      );
      const updatedTeam = updatedTeams.find((t) => t.id === currentTeam.id);
      const gained = updatedTeam ? updatedTeam.score - oldScore : currentCard.points;

      setTeams(updatedTeams);
      setTurnHits((prev) => prev + 1);
      setTurnPointsDelta((prev) => prev + gained);
      setWordVisible(true);
      void gameFeedback.notifyAnswer('correct');

      const nextFresh = freshDeck.length > 0 ? freshDeck.slice(1) : freshDeck;
      const nextSkipped =
        freshDeck.length === 0 && skippedDeck.length > 0
          ? skippedDeck.slice(1)
          : skippedDeck;

      setFreshDeck(nextFresh);
      setSkippedDeck(nextSkipped);

      if (nextFresh.length + nextSkipped.length === 0) {
        setPhase('finished');
      }
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Erro ao registrar acerto na rodada.');
      }
    }
  }, [phase, currentTeam, currentCard, useCases, gameFeedback, freshDeck, skippedDeck]);

  const handleSkip = useCallback(async () => {
    if (phase !== 'playing' || !currentTeam || !currentCard) {
      return;
    }
    try {
      setError(null);
      const oldScore = currentTeam.score;
      const updatedTeams = await useCases.scoreMimicaSkip(currentTeam.id);
      const updatedTeam = updatedTeams.find((t) => t.id === currentTeam.id);
      const diff = updatedTeam ? updatedTeam.score - oldScore : 0;

      setTeams(updatedTeams);
      setTurnSkips((prev) => prev + 1);
      setTurnPointsDelta((prev) => prev + diff);
      setWordVisible(true);
      void gameFeedback.notifyPass();

      if (freshDeck.length > 0) {
        const [skippedCard, ...restFresh] = freshDeck;
        setFreshDeck(restFresh);
        setSkippedDeck((prev) => [...prev, skippedCard]);
      } else if (skippedDeck.length > 1) {
        const [skippedCard, ...restSkipped] = skippedDeck;
        setSkippedDeck([...restSkipped, skippedCard]);
      }
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Erro ao pular palavra na rodada.');
      }
    }
  }, [phase, currentTeam, currentCard, useCases, gameFeedback, freshDeck, skippedDeck]);

  const handleNextTurn = useCallback(() => {
    if (remainingCardsCount === 0) {
      setPhase('finished');
      return;
    }

    const nextIndex = currentTeamIndex + 1;
    if (nextIndex < teams.length) {
      setCurrentTeamIndex(nextIndex);
      setSecondsRemaining(turnDurationSeconds);
      setPhase('pass-turn');
      return;
    }

    const nextRound = currentRound + 1;
    if (nextRound > totalRounds) {
      setPhase('finished');
      return;
    }

    setCurrentTeamIndex(0);
    setCurrentRound(nextRound);
    setSecondsRemaining(turnDurationSeconds);
    setPhase('pass-turn');
  }, [remainingCardsCount, currentTeamIndex, teams.length, turnDurationSeconds, currentRound, totalRounds]);

  const applySettings = useCallback((changes: Partial<MatchSettings['mimica']>) => {
    if (changes.totalRounds !== undefined) {
      setTotalRounds(changes.totalRounds);
    }
    if (changes.durationSeconds !== undefined) {
      setTurnDurationSeconds(changes.durationSeconds);
      setSecondsRemaining(changes.durationSeconds);
    }
  }, []);

  // O chip responde na hora; se o UseCase rejeitar, volta ao que está salvo.
  const saveSettings = useCallback(
    async (changes: Partial<MatchSettings['mimica']>) => {
      setError(null);
      applySettings(changes);
      try {
        await useCases.updateMimicaSettings(changes);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível salvar os parâmetros da partida.');
        }
        try {
          const stored = await useCases.getMatchSettings();
          applySettings(stored.mimica);
        } catch {
          // Mantém a mensagem de erro original.
        }
      }
    },
    [applySettings, useCases]
  );

  const handleSelectDuration = useCallback(
    (seconds: MimicaDurationOption) => saveSettings({ durationSeconds: seconds }),
    [saveSettings]
  );

  const handleSelectRounds = useCallback(
    (rounds: number) => saveSettings({ totalRounds: rounds }),
    [saveSettings]
  );

  const handleToggleCategory = useCallback(
    async (category: MimicaCategory) => {
      const exists = selectedCategories.includes(category);
      const nextCategories = exists
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];

      try {
        setError(null);
        setCategoryWarning(null);
        const cards = await useCases.listMimicaCards(nextCategories);
        setSelectedCategories(nextCategories);
        setFreshDeck(cards);
        setSkippedDeck([]);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setCategoryWarning(err.message);
        } else {
          setCategoryWarning('Não foi possível atualizar os pacotes de categorias.');
        }
      }
    },
    [selectedCategories, useCases]
  );

  const handleRequestExit = useCallback(() => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setConfirmingExit(false);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setConfirmingExit(false);
    router.replace('/');
  }, [router]);

  const handleGoToTeams = useCallback(() => {
    router.push('/teams');
  }, [router]);

  const handleGoToScoreboard = useCallback(() => {
    router.push('/scoreboard');
  }, [router]);

  const handleRetry = useCallback(async () => {
    await loadSession(selectedCategories);
  }, [loadSession, selectedCategories]);

  const state: MimicaState = {
    reduceMotion,
    phase,
    teams,
    currentTeamIndex,
    currentTeam,
    currentRound,
    totalRounds,
    isLastTurn,
    turnDurationSeconds,
    secondsRemaining,
    selectedCategories,
    currentCard,
    remainingCardsCount,
    wordVisible,
    turnHits,
    turnSkips,
    turnPointsDelta,
    confirmingExit,
    loading,
    error,
    categoryWarning,
  };

  const actions: MimicaActions = {
    handleSetReduceMotion,
    handleStartTurn,
    handleToggleWordVisibility,
    handleHit,
    handleSkip,
    handleTick,
    handleNextTurn,
    handleSelectDuration,
    handleSelectRounds,
    handleToggleCategory,
    handleRequestExit,
    handleCancelExit,
    handleConfirmExit,
    handleGoToTeams,
    handleGoToScoreboard,
    handleRetry,
  };

  return [state, actions];
}
