import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { QuizCategory, QuizOptionKey, QuizQuestion } from '@/model/entities/arenaChallenge';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type QuizPhase = 'pass-turn' | 'playing' | 'answered' | 'finished';

export type QuizDurationOption = 15 | 20 | 30;

export const ALL_QUIZ_CATEGORIES: QuizCategory[] = [
  'Bíblico',
  'Conhecimentos Gerais',
  'Geografia',
  'História',
  'Ciência',
  'Música e Cinema',
  'Esportes',
];

export type QuizState = {
  phase: QuizPhase;
  teams: Team[];
  currentTeamIndex: number;
  currentTeam: Team | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: QuizQuestion | null;
  selectedCategories: QuizCategory[];
  selectedOptionKey: QuizOptionKey | null;
  isCorrect: boolean | null;
  secondsRemaining: number;
  turnDurationSeconds: QuizDurationOption;
  turnScoreDelta: number;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
  categoryWarning: string | null;
};

export type QuizActions = {
  handleStartTurn: () => void;
  handleSelectOption: (key: QuizOptionKey) => Promise<void>;
  handleTick: () => void;
  handleNextQuestion: () => void;
  handleSelectDuration: (seconds: QuizDurationOption) => void;
  handleToggleCategory: (category: QuizCategory) => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => void;
  handleGoToScoreboard: () => void;
  handleGoToTeams: () => void;
  handleRetry: () => Promise<void>;
};

export function useQuizViewModel(
  useCase: IPgPlayUseCases = pgPlayUseCases
): [QuizState, QuizActions] {
  const router = useRouter();

  const [phase, setPhase] = useState<QuizPhase>('pass-turn');
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] =
    useState<QuizCategory[]>(ALL_QUIZ_CATEGORIES);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionKey, setSelectedOptionKey] = useState<QuizOptionKey | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [turnScoreDelta, setTurnScoreDelta] = useState<number>(0);
  const [turnDurationSeconds, setTurnDurationSeconds] = useState<QuizDurationOption>(20);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  const loadData = useCallback(
    async (categoriesToLoad: QuizCategory[] = ALL_QUIZ_CATEGORIES) => {
      setLoading(true);
      setError(null);
      setCategoryWarning(null);
      try {
        const [loadedTeams, loadedQuestions] = await Promise.all([
          useCase.listTeams(),
          useCase.listQuizQuestions(categoriesToLoad),
        ]);

        if (loadedTeams.length < 2) {
          setError('São necessárias pelo menos 2 equipes para jogar o Quiz Relâmpago.');
          setTeams(loadedTeams);
          return;
        }

        if (loadedQuestions.length === 0) {
          setError('Nenhuma pergunta encontrada no banco de Quiz.');
          return;
        }

        setTeams(loadedTeams);
        setQuestions(loadedQuestions);
        setCurrentTeamIndex(0);
        setCurrentQuestionIndex(0);
        setPhase('pass-turn');
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível inicializar a Arena de Quiz.');
        }
      } finally {
        setLoading(false);
      }
    },
    [useCase]
  );

  useEffect(() => {
    void loadData(ALL_QUIZ_CATEGORIES);
  }, [loadData]);

  const currentTeam: Team | null = teams[currentTeamIndex] ?? null;
  const currentQuestion: QuizQuestion | null = questions[currentQuestionIndex] ?? null;

  const handleTick = useCallback(() => {
    setSecondsRemaining((prev) => {
      if (prev <= 1) {
        setPhase('answered');
        setIsCorrect(false);
        setTurnScoreDelta(0);
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
      setError('Cadastre pelo menos 2 equipes antes de iniciar o Quiz.');
      return;
    }
    setCategoryWarning(null);
    setSelectedOptionKey(null);
    setIsCorrect(null);
    setTurnScoreDelta(0);
    setSecondsRemaining(turnDurationSeconds);
    setPhase('playing');
  }, [currentTeam, turnDurationSeconds]);

  const handleSelectOption = useCallback(
    async (key: QuizOptionKey) => {
      if (phase !== 'playing' || !currentQuestion || !currentTeam || selectedOptionKey !== null) {
        return;
      }

      const match = key === currentQuestion.correctKey;
      setSelectedOptionKey(key);
      setIsCorrect(match);
      setPhase('answered');

      const delta = match ? 10 : 0;
      setTurnScoreDelta(delta);

      try {
        const updatedTeams = await useCase.scoreQuizAnswer(currentTeam.id, match, 10);
        setTeams(updatedTeams);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        }
      }
    },
    [phase, currentQuestion, currentTeam, selectedOptionKey, useCase]
  );

  const handleNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase('finished');
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
    setSelectedOptionKey(null);
    setIsCorrect(null);
    setTurnScoreDelta(0);
    setPhase('pass-turn');
  }, [currentQuestionIndex, questions.length, teams.length]);

  const handleSelectDuration = useCallback((seconds: QuizDurationOption) => {
    setTurnDurationSeconds(seconds);
    setSecondsRemaining(seconds);
  }, []);

  const handleToggleCategory = useCallback(
    async (category: QuizCategory) => {
      const exists = selectedCategories.includes(category);
      const nextCategories = exists
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];

      try {
        setCategoryWarning(null);
        const filteredQuestions = await useCase.listQuizQuestions(nextCategories);
        setSelectedCategories(nextCategories);
        setQuestions(filteredQuestions);
        setCurrentQuestionIndex(0);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setCategoryWarning(err.message);
        } else {
          setCategoryWarning('Não foi possível atualizar os pacotes de perguntas.');
        }
      }
    },
    [selectedCategories, useCase]
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

  const handleGoToTeams = useCallback(() => {
    router.push('/teams');
  }, [router]);

  const handleRetry = useCallback(async () => {
    await loadData(selectedCategories);
  }, [loadData, selectedCategories]);

  const state: QuizState = {
    phase,
    teams,
    currentTeamIndex,
    currentTeam,
    currentQuestionIndex,
    totalQuestions: questions.length,
    currentQuestion,
    selectedCategories,
    selectedOptionKey,
    isCorrect,
    secondsRemaining,
    turnDurationSeconds,
    turnScoreDelta,
    confirmingExit,
    loading,
    error,
    categoryWarning,
  };

  const actions: QuizActions = {
    handleStartTurn,
    handleSelectOption,
    handleTick,
    handleNextQuestion,
    handleSelectDuration,
    handleToggleCategory,
    handleRequestExit,
    handleCancelExit,
    handleConfirmExit,
    handleGoToScoreboard,
    handleGoToTeams,
    handleRetry,
  };

  return [state, actions];
}
