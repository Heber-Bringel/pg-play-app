import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { QuizCategory, QuizOptionKey, QuizQuestion } from '@/model/entities/arenaChallenge';
import {
  DEFAULT_MATCH_SETTINGS,
  type QuizDurationOption,
  type QuizQuestionCountOption,
  type QuizSettings,
} from '@/model/entities/matchSettings';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type QuizPhase = 'pass-turn' | 'playing' | 'answered' | 'finished';

export type { QuizDurationOption, QuizQuestionCountOption } from '@/model/entities/matchSettings';

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
  isLastQuestion: boolean;
  questionsPerTeam: number;
  configuredQuestionCount: QuizQuestionCountOption;
  availableQuestionCounts: QuizQuestionCountOption[];
  questionCountNotice: string | null;
  currentQuestion: QuizQuestion | null;
  selectedOptionKey: QuizOptionKey | null;
  isCorrect: boolean | null;
  secondsRemaining: number;
  turnDurationSeconds: QuizDurationOption;
  turnScoreDelta: number;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
};

export type QuizActions = {
  handleStartTurn: () => void;
  handleSelectOption: (key: QuizOptionKey) => Promise<void>;
  handleTick: () => void;
  handleNextQuestion: () => void;
  handleSelectDuration: (seconds: QuizDurationOption) => Promise<void>;
  handleSelectQuestionCount: (count: QuizQuestionCountOption) => Promise<void>;
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
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionKey, setSelectedOptionKey] = useState<QuizOptionKey | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [turnScoreDelta, setTurnScoreDelta] = useState<number>(0);
  const [turnDurationSeconds, setTurnDurationSeconds] = useState<QuizDurationOption>(
    DEFAULT_MATCH_SETTINGS.quiz.durationSeconds
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    DEFAULT_MATCH_SETTINGS.quiz.durationSeconds
  );
  const [configuredQuestionCount, setConfiguredQuestionCount] =
    useState<QuizQuestionCountOption>(
      DEFAULT_MATCH_SETTINGS.quiz.questionCount
    );
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedTeams, loadedQuestions, settings] = await Promise.all([
        useCase.listTeams(),
        useCase.listQuizQuestions(),
        useCase.getMatchSettings(),
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
      setTurnDurationSeconds(settings.quiz.durationSeconds);
      setSecondsRemaining(settings.quiz.durationSeconds);
      setConfiguredQuestionCount(settings.quiz.questionCount);
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
  }, [useCase]);

  useEffect(() => {
    void loadData();
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

  const matchPlan = useCase.planQuizMatch(
    configuredQuestionCount,
    questions.length,
    teams.length
  );
  const totalQuestions = matchPlan.totalQuestions;
  const availableQuestionCounts = useCase.listAvailableQuizQuestionCounts(questions.length);
  const isLastQuestion = currentQuestionIndex + 1 >= totalQuestions;

  let questionCountNotice: string | null = null;
  if (questions.length > 0 && totalQuestions !== configuredQuestionCount) {
    const bankNotice = matchPlan.limitedByBank
      ? `O pacote atual tem ${questions.length} perguntas. `
      : '';
    questionCountNotice =
      `${bankNotice}Serão ${totalQuestions} perguntas, ` +
      `${matchPlan.questionsPerTeam} por equipe, para todas responderem a mesma quantidade.`;
  }

  const handleNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= totalQuestions) {
      setPhase('finished');
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
    setSelectedOptionKey(null);
    setIsCorrect(null);
    setTurnScoreDelta(0);
    setPhase('pass-turn');
  }, [currentQuestionIndex, teams.length, totalQuestions]);

  const applySettings = useCallback((changes: Partial<QuizSettings>) => {
    if (changes.durationSeconds !== undefined) {
      setTurnDurationSeconds(changes.durationSeconds);
      setSecondsRemaining(changes.durationSeconds);
    }
    if (changes.questionCount !== undefined) {
      setConfiguredQuestionCount(changes.questionCount);
    }
  }, []);

  // O chip responde na hora; se o UseCase rejeitar, volta ao que está salvo.
  const saveSettings = useCallback(
    async (changes: Partial<QuizSettings>) => {
      setError(null);
      applySettings(changes);
      try {
        await useCase.updateQuizSettings(changes);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível salvar os parâmetros da partida.');
        }
        try {
          const stored = await useCase.getMatchSettings();
          applySettings(stored.quiz);
        } catch {
          // Mantém a mensagem de erro original.
        }
      }
    },
    [applySettings, useCase]
  );

  const handleSelectDuration = useCallback(
    (seconds: QuizDurationOption) => saveSettings({ durationSeconds: seconds }),
    [saveSettings]
  );

  const handleSelectQuestionCount = useCallback(
    (count: QuizQuestionCountOption) => saveSettings({ questionCount: count }),
    [saveSettings]
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

  const state: QuizState = {
    phase,
    teams,
    currentTeamIndex,
    currentTeam,
    currentQuestionIndex,
    totalQuestions,
    isLastQuestion,
    questionsPerTeam: matchPlan.questionsPerTeam,
    configuredQuestionCount,
    availableQuestionCounts,
    questionCountNotice,
    currentQuestion,
    selectedOptionKey,
    isCorrect,
    secondsRemaining,
    turnDurationSeconds,
    turnScoreDelta,
    confirmingExit,
    loading,
    error,
  };

  const actions: QuizActions = {
    handleStartTurn,
    handleSelectOption,
    handleTick,
    handleNextQuestion,
    handleSelectDuration,
    handleSelectQuestionCount,
    handleRequestExit,
    handleCancelExit,
    handleConfirmExit,
    handleGoToScoreboard,
    handleGoToTeams,
    handleRetry: loadData,
  };

  return [state, actions];
}
