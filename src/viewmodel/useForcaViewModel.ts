import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { ForcaCategory, ForcaPuzzle } from '@/model/entities/arenaChallenge';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type ForcaPhase = 'pass-turn' | 'playing' | 'word-result' | 'finished';

export type ForcaAttemptsOption = 5 | 6 | 8;

export const ALL_FORCA_CATEGORIES: ForcaCategory[] = [
  'Bíblico',
  'Animais',
  'Países e Cidades',
  'Frutas e Comidas',
  'Filmes',
  'Profissões',
  'Esportes',
];

export type MaskedLetter = {
  original: string;
  normalized: string;
  revealed: boolean;
  isSpecial: boolean;
};

export type ForcaState = {
  phase: ForcaPhase;
  teams: Team[];
  currentTeamIndex: number;
  currentTeam: Team | null;
  currentRound: number;
  totalRounds: number;
  maxAttempts: ForcaAttemptsOption;
  remainingAttempts: number;
  selectedCategories: ForcaCategory[];
  currentPuzzle: ForcaPuzzle | null;
  remainingPuzzlesCount: number;
  guessedLetters: string[];
  maskedWord: MaskedLetter[];
  wordWon: boolean;
  wordLost: boolean;
  earnedPoints: number;
  bonusPoints: number;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
};

export type ForcaActions = {
  handleStartTurn: () => void;
  handleGuessLetter: (letter: string) => Promise<void>;
  handleResetWord: () => void;
  handleNextWord: () => void;
  handleSelectAttempts: (attempts: ForcaAttemptsOption) => void;
  handleSelectRounds: (rounds: number) => void;
  handleToggleCategory: (category: ForcaCategory) => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => void;
  handleGoToScoreboard: () => void;
  handleRetry: () => Promise<void>;
};

export function normalizeChar(char: string): string {
  return char
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function buildMaskedWord(
  word: string,
  guessedLetters: string[],
  revealAll: boolean = false
): MaskedLetter[] {
  const guessedSet = new Set(guessedLetters.map((l) => normalizeChar(l)));

  return word.split('').map((char) => {
    const isSpecial = char === ' ' || char === '-';
    const norm = normalizeChar(char);
    const revealed = revealAll || isSpecial || guessedSet.has(norm);

    return {
      original: char,
      normalized: norm,
      revealed,
      isSpecial,
    };
  });
}

export function isWordCompleted(word: string, guessedLetters: string[]): boolean {
  const guessedSet = new Set(guessedLetters.map((l) => normalizeChar(l)));
  for (const char of word) {
    if (char === ' ' || char === '-') continue;
    const norm = normalizeChar(char);
    if (!guessedSet.has(norm)) {
      return false;
    }
  }
  return true;
}

export function useForcaViewModel(
  useCases: IPgPlayUseCases = pgPlayUseCases
): [ForcaState, ForcaActions] {
  const router = useRouter();

  const [phase, setPhase] = useState<ForcaPhase>('pass-turn');
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [maxAttempts, setMaxAttempts] = useState<ForcaAttemptsOption>(5);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5);
  const [selectedCategories, setSelectedCategories] = useState<ForcaCategory[]>(ALL_FORCA_CATEGORIES);
  const [freshDeck, setFreshDeck] = useState<ForcaPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<ForcaPuzzle | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wordWon, setWordWon] = useState<boolean>(false);
  const [wordLost, setWordLost] = useState<boolean>(false);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [bonusPoints, setBonusPoints] = useState<number>(0);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(
    async (categoriesToLoad: ForcaCategory[]) => {
      setLoading(true);
      setError(null);
      try {
        const [loadedTeams, loadedPuzzles] = await Promise.all([
          useCases.listTeams(),
          useCases.listForcaPuzzles(categoriesToLoad),
        ]);
        setTeams(loadedTeams);
        setFreshDeck(loadedPuzzles);
        if (loadedPuzzles.length > 0) {
          setCurrentPuzzle(loadedPuzzles[0]);
        } else {
          setCurrentPuzzle(null);
        }
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível carregar a Arena do Jogo da Forca.');
        }
      } finally {
        setLoading(false);
      }
    },
    [useCases]
  );

  useEffect(() => {
    void loadSession(selectedCategories);
  }, [loadSession, selectedCategories]);

  const currentTeam = teams[currentTeamIndex] ?? null;

  const maskedWord = currentPuzzle
    ? buildMaskedWord(currentPuzzle.word, guessedLetters, wordWon || wordLost)
    : [];

  const handleStartTurn = useCallback(() => {
    setGuessedLetters([]);
    setRemainingAttempts(maxAttempts);
    setWordWon(false);
    setWordLost(false);
    setEarnedPoints(0);
    setBonusPoints(0);
    setPhase('playing');
  }, [maxAttempts]);

  const handleGuessLetter = useCallback(
    async (letter: string) => {
      if (phase !== 'playing' || !currentPuzzle || !currentTeam || wordWon || wordLost) {
        return;
      }

      const norm = normalizeChar(letter);
      if (guessedLetters.some((l) => normalizeChar(l) === norm)) {
        return;
      }

      const nextGuessed = [...guessedLetters, norm];
      setGuessedLetters(nextGuessed);

      const wordHasLetter = currentPuzzle.word
        .split('')
        .some((c) => normalizeChar(c) === norm);

      if (wordHasLetter) {
        const completed = isWordCompleted(currentPuzzle.word, nextGuessed);
        if (completed) {
          setWordWon(true);
          const bonus = remainingAttempts * 2;
          const total = 30 + bonus;
          setBonusPoints(bonus);
          setEarnedPoints(total);
          setPhase('word-result');
          try {
            const updatedTeams = await useCases.scoreForcaWord(
              currentTeam.id,
              remainingAttempts
            );
            setTeams(updatedTeams);
          } catch (err: unknown) {
            if (err instanceof DomainError) {
              setError(err.message);
            }
          }
        }
      } else {
        const nextAttempts = remainingAttempts - 1;
        setRemainingAttempts(nextAttempts);

        if (nextAttempts <= 0) {
          setWordLost(true);
          setEarnedPoints(0);
          setBonusPoints(0);
          setPhase('word-result');
        }
      }
    },
    [
      currentPuzzle,
      currentTeam,
      guessedLetters,
      phase,
      remainingAttempts,
      useCases,
      wordLost,
      wordWon,
    ]
  );

  const handleResetWord = useCallback(() => {
    setGuessedLetters([]);
    setRemainingAttempts(maxAttempts);
    setWordWon(false);
    setWordLost(false);
    setEarnedPoints(0);
    setBonusPoints(0);
    if (phase === 'word-result') {
      setPhase('playing');
    }
  }, [maxAttempts, phase]);

  const handleNextWord = useCallback(() => {
    const nextDeck = freshDeck.slice(1);
    setFreshDeck(nextDeck);

    const isLastTeam = currentTeamIndex >= teams.length - 1;
    const nextRound = isLastTeam ? currentRound + 1 : currentRound;
    const nextTeamIndex = isLastTeam ? 0 : currentTeamIndex + 1;

    const sessionFinished = nextRound > totalRounds || nextDeck.length === 0;

    if (sessionFinished) {
      setPhase('finished');
      return;
    }

    setCurrentRound(nextRound);
    setCurrentTeamIndex(nextTeamIndex);
    setCurrentPuzzle(nextDeck[0] ?? null);
    setGuessedLetters([]);
    setRemainingAttempts(maxAttempts);
    setWordWon(false);
    setWordLost(false);
    setEarnedPoints(0);
    setBonusPoints(0);
    setPhase('pass-turn');
  }, [
    currentRound,
    currentTeamIndex,
    freshDeck,
    maxAttempts,
    teams.length,
    totalRounds,
  ]);

  const handleSelectAttempts = useCallback((attempts: ForcaAttemptsOption) => {
    setMaxAttempts(attempts);
    setRemainingAttempts(attempts);
  }, []);

  const handleSelectRounds = useCallback((rounds: number) => {
    if (rounds >= 1 && rounds <= 5) {
      setTotalRounds(rounds);
    }
  }, []);

  const handleToggleCategory = useCallback(
    async (category: ForcaCategory) => {
      const exists = selectedCategories.includes(category);
      if (exists && selectedCategories.length === 1) {
        return;
      }
      const updated = exists
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];
      setSelectedCategories(updated);
      await loadSession(updated);
    },
    [loadSession, selectedCategories]
  );

  const handleRequestExit = useCallback(() => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setConfirmingExit(false);
  }, []);

  const handleConfirmExit = useCallback(() => {
    router.replace('/');
  }, [router]);

  const handleGoToScoreboard = useCallback(() => {
    router.replace('/scoreboard');
  }, [router]);

  const handleRetry = useCallback(async () => {
    await loadSession(selectedCategories);
  }, [loadSession, selectedCategories]);

  return [
    {
      phase,
      teams,
      currentTeamIndex,
      currentTeam,
      currentRound,
      totalRounds,
      maxAttempts,
      remainingAttempts,
      selectedCategories,
      currentPuzzle,
      remainingPuzzlesCount: freshDeck.length,
      guessedLetters,
      maskedWord,
      wordWon,
      wordLost,
      earnedPoints,
      bonusPoints,
      confirmingExit,
      loading,
      error,
    },
    {
      handleStartTurn,
      handleGuessLetter,
      handleResetWord,
      handleNextWord,
      handleSelectAttempts,
      handleSelectRounds,
      handleToggleCategory,
      handleRequestExit,
      handleCancelExit,
      handleConfirmExit,
      handleGoToScoreboard,
      handleRetry,
    },
  ];
}
