import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases, gameFeedbackUseCases } from '@/di/container';
import type {
  DesenhoCard,
  DesenhoCategory,
  DrawingPenColorId,
  DrawingPoint,
  DrawingStroke,
  DrawingStrokeWidthId,
} from '@/model/entities/drawingChallenge';
import {
  DEFAULT_MATCH_SETTINGS,
  type DesenhoDurationOption,
  type MatchSettings,
} from '@/model/entities/matchSettings';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IGameFeedbackUseCases } from '@/usecase/iGameFeedbackUseCases';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type DesenhoPhase = 'pass-turn' | 'drawing' | 'turn-summary' | 'finished';

export type { DesenhoDurationOption } from '@/model/entities/matchSettings';

export const ALL_DESENHO_CATEGORIES: DesenhoCategory[] = [
  'Bíblico',
  'Animais',
  'Objetos',
  'Comidas',
  'Lugares e Natureza',
];

export type DesenhoState = {
  reduceMotion: boolean;
  phase: DesenhoPhase;
  teams: Team[];
  currentTeamIndex: number;
  currentTeam: Team | null;
  currentRound: number;
  totalRounds: number;
  isLastTurn: boolean;
  turnDurationSeconds: DesenhoDurationOption;
  secondsRemaining: number;
  selectedCategories: DesenhoCategory[];
  currentCard: DesenhoCard | null;
  lastTurnCard: DesenhoCard | null;
  remainingCardsCount: number;
  wordVisible: boolean;
  strokes: DrawingStroke[];
  selectedColor: DrawingPenColorId;
  selectedWidth: DrawingStrokeWidthId;
  turnHits: number;
  turnSkips: number;
  turnPointsDelta: number;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
  categoryWarning: string | null;
};

export type DesenhoActions = {
  handleSetReduceMotion: (enabled: boolean) => void;
  handleStartTurn: () => void;
  handleToggleWordVisibility: () => void;
  handleAddStroke: (points: DrawingPoint[]) => void;
  handleSelectColor: (colorId: DrawingPenColorId) => void;
  handleSelectWidth: (widthId: DrawingStrokeWidthId) => void;
  handleUndoStroke: () => void;
  handleClearCanvas: () => void;
  handleHit: () => Promise<void>;
  handleSkip: () => Promise<void>;
  handleTick: () => void;
  handleNextTurn: () => void;
  handleSelectDuration: (seconds: DesenhoDurationOption) => Promise<void>;
  handleSelectRounds: (rounds: number) => Promise<void>;
  handleToggleCategory: (category: DesenhoCategory) => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => void;
  handleGoToScoreboard: () => void;
  handleRetry: () => Promise<void>;
};

export function useDesenhoViewModel(
  useCases: IPgPlayUseCases = pgPlayUseCases,
  gameFeedback: IGameFeedbackUseCases = gameFeedbackUseCases
): [DesenhoState, DesenhoActions] {
  const router = useRouter();

  const [phase, setPhase] = useState<DesenhoPhase>('pass-turn');
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(
    DEFAULT_MATCH_SETTINGS.desenho.totalRounds
  );
  const [turnDurationSeconds, setTurnDurationSeconds] = useState<DesenhoDurationOption>(
    DEFAULT_MATCH_SETTINGS.desenho.durationSeconds
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    DEFAULT_MATCH_SETTINGS.desenho.durationSeconds
  );

  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const previousSecondsRef = useRef<number>(secondsRemaining);

  useEffect(() => {
    const previousSeconds = previousSecondsRef.current;
    previousSecondsRef.current = secondsRemaining;
    void gameFeedback.notifyTimerTick(previousSeconds, secondsRemaining, {
      reduceMotion,
    });
  }, [secondsRemaining, reduceMotion, gameFeedback]);

  const handleSetReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotionState(enabled);
  }, []);

  const [selectedCategories, setSelectedCategories] =
    useState<DesenhoCategory[]>(ALL_DESENHO_CATEGORIES);
  const [freshDeck, setFreshDeck] = useState<DesenhoCard[]>([]);
  const [skippedDeck, setSkippedDeck] = useState<DesenhoCard[]>([]);
  const [lastTurnCard, setLastTurnCard] = useState<DesenhoCard | null>(null);
  const [wordVisible, setWordVisible] = useState<boolean>(true);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [selectedColor, setSelectedColor] = useState<DrawingPenColorId>('ink');
  const [selectedWidth, setSelectedWidth] = useState<DrawingStrokeWidthId>('thin');
  const [turnHits, setTurnHits] = useState<number>(0);
  const [turnSkips, setTurnSkips] = useState<number>(0);
  const [turnPointsDelta, setTurnPointsDelta] = useState<number>(0);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  const strokeCounterRef = useRef<number>(0);

  const loadSession = useCallback(
    async (categoriesToLoad: DesenhoCategory[]) => {
      setLoading(true);
      setError(null);
      setCategoryWarning(null);
      try {
        const [loadedTeams, loadedCards, settings] = await Promise.all([
          useCases.listTeams(),
          useCases.listDesenhoCards(categoriesToLoad),
          useCases.getMatchSettings(),
        ]);
        setTeams(loadedTeams);
        setFreshDeck(loadedCards);
        setSkippedDeck([]);
        setLastTurnCard(null);
        setStrokes([]);
        setTotalRounds(settings.desenho.totalRounds);
        setTurnDurationSeconds(settings.desenho.durationSeconds);
        setSecondsRemaining(settings.desenho.durationSeconds);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível carregar a Arena de Desenho Relâmpago.');
        }
      } finally {
        setLoading(false);
      }
    },
    [useCases]
  );

  useEffect(() => {
    void loadSession(ALL_DESENHO_CATEGORIES);
  }, [loadSession]);

  const currentCard: DesenhoCard | null =
    freshDeck.length > 0
      ? freshDeck[0]
      : skippedDeck.length > 0
        ? skippedDeck[0]
        : null;

  const currentCardRef = useRef<DesenhoCard | null>(currentCard);
  currentCardRef.current = currentCard;

  const freshDeckRef = useRef<DesenhoCard[]>(freshDeck);
  freshDeckRef.current = freshDeck;

  const skippedDeckRef = useRef<DesenhoCard[]>(skippedDeck);
  skippedDeckRef.current = skippedDeck;

  const remainingCardsCount = freshDeck.length + skippedDeck.length;
  const currentTeam: Team | null = teams[currentTeamIndex] ?? null;
  const isLastTurn =
    remainingCardsCount === 0 ||
    (currentTeamIndex + 1 >= teams.length && currentRound >= totalRounds);

  const rotateCurrentCardOnExpire = useCallback(() => {
    const activeCard = currentCardRef.current;
    setLastTurnCard(activeCard);
    setStrokes([]);

    const currentFresh = freshDeckRef.current;
    const currentSkipped = skippedDeckRef.current;
    if (currentFresh.length > 0) {
      const [expiredCard, ...restFresh] = currentFresh;
      setFreshDeck(restFresh);
      setSkippedDeck([...currentSkipped, expiredCard]);
    } else if (currentSkipped.length > 1) {
      const [expiredCard, ...restSkipped] = currentSkipped;
      setSkippedDeck([...restSkipped, expiredCard]);
    }
  }, []);

  const handleTick = useCallback(() => {
    setSecondsRemaining((prev) => {
      if (prev <= 1) {
        rotateCurrentCardOnExpire();
        setPhase('turn-summary');
        return 0;
      }
      return prev - 1;
    });
  }, [rotateCurrentCardOnExpire]);

  useEffect(() => {
    if (phase !== 'drawing' || confirmingExit) {
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
    setLastTurnCard(null);
    setWordVisible(true);
    setStrokes([]);
    setTurnHits(0);
    setTurnSkips(0);
    setTurnPointsDelta(0);
    setSecondsRemaining(turnDurationSeconds);
    setPhase('drawing');
  }, [currentTeam, currentCard, turnDurationSeconds]);

  const handleToggleWordVisibility = useCallback(() => {
    setWordVisible((prev) => !prev);
  }, []);

  const handleAddStroke = useCallback(
    (points: DrawingPoint[]) => {
      if (phase !== 'drawing' || confirmingExit || points.length === 0) {
        return;
      }
      strokeCounterRef.current += 1;
      const stroke: DrawingStroke = {
        id: `stroke-${strokeCounterRef.current}`,
        points: points.map((p) => ({ x: p.x, y: p.y })),
        colorId: selectedColor,
        widthId: selectedWidth,
      };
      setStrokes((prev) => [...prev, stroke]);
    },
    [phase, confirmingExit, selectedColor, selectedWidth]
  );

  const handleSelectColor = useCallback((colorId: DrawingPenColorId) => {
    setSelectedColor(colorId);
  }, []);

  const handleSelectWidth = useCallback((widthId: DrawingStrokeWidthId) => {
    setSelectedWidth(widthId);
  }, []);

  const handleUndoStroke = useCallback(() => {
    setStrokes((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const handleClearCanvas = useCallback(() => {
    setStrokes([]);
  }, []);

  const handleHit = useCallback(async () => {
    if (phase !== 'drawing' || confirmingExit || !currentTeam || !currentCard) {
      return;
    }
    try {
      setError(null);
      const oldScore = currentTeam.score;
      const updatedTeams = await useCases.scoreDesenhoHit(
        currentTeam.id,
        currentCard.points
      );
      const updatedTeam = updatedTeams.find((t) => t.id === currentTeam.id);
      const gained = updatedTeam ? updatedTeam.score - oldScore : currentCard.points;

      setTeams(updatedTeams);
      setTurnHits((prev) => prev + 1);
      setTurnPointsDelta((prev) => prev + gained);
      setWordVisible(true);
      setStrokes([]);

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
  }, [phase, confirmingExit, currentTeam, currentCard, useCases, freshDeck, skippedDeck]);

  const handleSkip = useCallback(async () => {
    if (phase !== 'drawing' || confirmingExit || !currentTeam || !currentCard) {
      return;
    }
    try {
      setError(null);
      const oldScore = currentTeam.score;
      const updatedTeams = await useCases.scoreDesenhoSkip(currentTeam.id);
      const updatedTeam = updatedTeams.find((t) => t.id === currentTeam.id);
      const diff = updatedTeam ? updatedTeam.score - oldScore : 0;

      setTeams(updatedTeams);
      setTurnSkips((prev) => prev + 1);
      setTurnPointsDelta((prev) => prev + diff);
      setWordVisible(true);
      setStrokes([]);

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
  }, [phase, confirmingExit, currentTeam, currentCard, useCases, freshDeck, skippedDeck]);

  const handleNextTurn = useCallback(() => {
    setStrokes([]);
    setLastTurnCard(null);
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
  }, [
    remainingCardsCount,
    currentTeamIndex,
    teams.length,
    turnDurationSeconds,
    currentRound,
    totalRounds,
  ]);

  const applySettings = useCallback((changes: Partial<MatchSettings['desenho']>) => {
    if (changes.totalRounds !== undefined) {
      setTotalRounds(changes.totalRounds);
    }
    if (changes.durationSeconds !== undefined) {
      setTurnDurationSeconds(changes.durationSeconds);
      setSecondsRemaining(changes.durationSeconds);
    }
  }, []);

  const saveSettings = useCallback(
    async (changes: Partial<MatchSettings['desenho']>) => {
      setError(null);
      applySettings(changes);
      try {
        await useCases.updateDesenhoSettings(changes);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível salvar os parâmetros da partida.');
        }
        try {
          const stored = await useCases.getMatchSettings();
          applySettings(stored.desenho);
        } catch {
          // Mantém a mensagem de erro original.
        }
      }
    },
    [applySettings, useCases]
  );

  const handleSelectDuration = useCallback(
    (seconds: DesenhoDurationOption) => saveSettings({ durationSeconds: seconds }),
    [saveSettings]
  );

  const handleSelectRounds = useCallback(
    (rounds: number) => saveSettings({ totalRounds: rounds }),
    [saveSettings]
  );

  const handleToggleCategory = useCallback(
    async (category: DesenhoCategory) => {
      const exists = selectedCategories.includes(category);
      const nextCategories = exists
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];

      try {
        setError(null);
        setCategoryWarning(null);
        const cards = await useCases.listDesenhoCards(nextCategories);
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

  const handleGoToScoreboard = useCallback(() => {
    router.push('/scoreboard');
  }, [router]);

  const handleRetry = useCallback(async () => {
    await loadSession(selectedCategories);
  }, [loadSession, selectedCategories]);

  const state: DesenhoState = {
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
    lastTurnCard,
    remainingCardsCount,
    wordVisible,
    strokes,
    selectedColor,
    selectedWidth,
    turnHits,
    turnSkips,
    turnPointsDelta,
    confirmingExit,
    loading,
    error,
    categoryWarning,
  };

  const actions: DesenhoActions = {
    handleSetReduceMotion,
    handleStartTurn,
    handleToggleWordVisibility,
    handleAddStroke,
    handleSelectColor,
    handleSelectWidth,
    handleUndoStroke,
    handleClearCanvas,
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
    handleGoToScoreboard,
    handleRetry,
  };

  return [state, actions];
}
