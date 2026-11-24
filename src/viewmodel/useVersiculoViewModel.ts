import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  versiculoUseCases as defaultVersiculoUseCases,
  gameFeedbackUseCases,
} from '@/di/container';
import type { Team } from '@/model/entities/team';
import type {
  VerseBlankResult,
  VerseDurationOption,
  VerseHint,
  VersePack,
  VersePassage,
} from '@/model/entities/versePassage';
import { DomainError } from '@/model/errors';
import type { IVersiculoUseCases } from '@/usecase/iVersiculoUseCases';
import type { IGameFeedbackUseCases } from '@/usecase/iGameFeedbackUseCases';

export const ALL_VERSE_PACKS: VersePack[] = [
  'Salmos e Provérbios',
  'Evangelhos',
  'Cartas de Paulo',
  'Antigo Testamento',
];

export const VERSE_DURATION_OPTIONS: VerseDurationOption[] = [30, 45, 60];

export const VERSE_ROUNDS_OPTIONS: number[] = [1, 2, 3, 4, 5];

export type VersiculoPhase =
  | 'setup'
  | 'handoff'
  | 'playing'
  | 'review'
  | 'finished';

export type VersiculoState = {
  reduceMotion: boolean;
  loading: boolean;
  error: string | null;
  phase: VersiculoPhase;
  teams: Team[];
  selectedPacks: VersePack[];
  durationSeconds: VerseDurationOption;
  passagesPerTeam: number;
  passages: VersePassage[];
  currentPassageIndex: number;
  currentPassage: VersePassage | null;
  currentTeam: Team | null;
  secondsRemaining: number;
  activeBlankIndex: number;
  answersByIndex: Record<number, string>;
  usedHint: boolean;
  hints: VerseHint[];
  results: VerseBlankResult[];
  turnPoints: number;
  sessionScoresByTeamId: Record<string, number>;
  exitConfirmVisible: boolean;
};

export type VersiculoActions = {
  setReduceMotion: (enabled: boolean) => void;
  reloadTeams: () => Promise<void>;
  togglePack: (pack: VersePack) => void;
  selectDuration: (seconds: VerseDurationOption) => void;
  selectPassagesPerTeam: (count: number) => void;
  startMatch: () => Promise<void>;
  startTurn: () => void;
  selectBlank: (blankIndex: number) => void;
  setAnswer: (blankIndex: number, text: string) => void;
  revealHint: () => void;
  submitAnswers: () => void;
  nextTurn: () => Promise<void>;
  restartMatch: () => void;
  requestExit: () => void;
  cancelExit: () => void;
  confirmExit: () => void;
  goToTeams: () => void;
  goToScoreboard: () => void;
};

function sumResultPoints(results: VerseBlankResult[]): number {
  return results.reduce((acc, item) => acc + item.pointsAwarded, 0);
}

export function useVersiculoViewModel(
  useCase: IVersiculoUseCases = defaultVersiculoUseCases,
  gameFeedback: IGameFeedbackUseCases = gameFeedbackUseCases
): [VersiculoState, VersiculoActions] {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<VersiculoPhase>('setup');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPacks, setSelectedPacks] =
    useState<VersePack[]>(ALL_VERSE_PACKS);
  const [durationSeconds, setDurationSeconds] =
    useState<VerseDurationOption>(45);
  const [passagesPerTeam, setPassagesPerTeam] = useState<number>(3);
  const [passages, setPassages] = useState<VersePassage[]>([]);
  const [currentPassageIndex, setCurrentPassageIndex] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);

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
  const [activeBlankIndex, setActiveBlankIndex] = useState<number>(1);
  const [answersByIndex, setAnswersByIndex] = useState<Record<number, string>>(
    {}
  );
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [hints, setHints] = useState<VerseHint[]>([]);
  const [results, setResults] = useState<VerseBlankResult[]>([]);
  const [sessionScoresByTeamId, setSessionScoresByTeamId] = useState<
    Record<string, number>
  >({});
  const [exitConfirmVisible, setExitConfirmVisible] = useState<boolean>(false);

  const reloadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedTeams = await useCase.listTeams();
      setTeams(loadedTeams);
    } catch (err) {
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

  const currentPassage = passages[currentPassageIndex] ?? null;
  const currentTeam =
    teams.length > 0 ? teams[currentPassageIndex % teams.length] : null;
  const turnPoints = sumResultPoints(results);

  const evaluateCurrentTurn = useCallback(
    (passage: VersePassage, answers: Record<number, string>, hintUsed: boolean) => {
      const evaluated = useCase.evaluateAnswers(passage, answers, hintUsed);
      setResults(evaluated);
      setPhase('review');
      return evaluated;
    },
    [useCase]
  );

  useEffect(() => {
    if (phase !== 'playing' || exitConfirmVisible || !currentPassage) {
      return;
    }

    if (secondsRemaining <= 0) {
      evaluateCurrentTurn(currentPassage, answersByIndex, usedHint);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [
    answersByIndex,
    currentPassage,
    evaluateCurrentTurn,
    exitConfirmVisible,
    phase,
    secondsRemaining,
    usedHint,
  ]);

  const togglePack = useCallback((pack: VersePack) => {
    setError(null);
    setSelectedPacks((prev) =>
      prev.includes(pack)
        ? prev.filter((item) => item !== pack)
        : [...prev, pack]
    );
  }, []);

  const selectDuration = useCallback((seconds: VerseDurationOption) => {
    setError(null);
    setDurationSeconds(seconds);
    setSecondsRemaining(seconds);
  }, []);

  const selectPassagesPerTeam = useCallback((count: number) => {
    setError(null);
    setPassagesPerTeam(count);
  }, []);

  const startMatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prepared = await useCase.prepareMatch({
        packs: selectedPacks,
        durationSeconds,
        passagesPerTeam,
      });

      const initialScores: Record<string, number> = {};
      prepared.teams.forEach((team) => {
        initialScores[team.id] = 0;
      });

      setTeams(prepared.teams);
      setPassages(prepared.passages);
      setCurrentPassageIndex(0);
      setSecondsRemaining(durationSeconds);
      setAnswersByIndex({});
      setUsedHint(false);
      setHints([]);
      setResults([]);
      setSessionScoresByTeamId(initialScores);
      setPhase('handoff');
    } catch (err) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar Complete o Versículo.');
      }
    } finally {
      setLoading(false);
    }
  }, [durationSeconds, passagesPerTeam, selectedPacks, useCase]);

  const startTurn = useCallback(() => {
    setError(null);
    setAnswersByIndex({});
    setActiveBlankIndex(currentPassage?.blanks[0]?.index ?? 1);
    setUsedHint(false);
    setHints([]);
    setResults([]);
    setSecondsRemaining(durationSeconds);
    setPhase('playing');
  }, [currentPassage, durationSeconds]);

  const selectBlank = useCallback((blankIndex: number) => {
    setActiveBlankIndex(blankIndex);
  }, []);

  const setAnswer = useCallback(
    (blankIndex: number, text: string) => {
      setAnswersByIndex((prev) => {
        const updated = {
          ...prev,
          [blankIndex]: text,
        };

        if (currentPassage && currentPassage.blanks.length > 1) {
          const nextUnanswered = currentPassage.blanks.find(
            (b) => b.index !== blankIndex && !(updated[b.index] ?? '').trim()
          );
          if (nextUnanswered) {
            setActiveBlankIndex(nextUnanswered.index);
          }
        }

        return updated;
      });
    },
    [currentPassage]
  );

  const revealHint = useCallback(() => {
    if (!currentPassage || usedHint) {
      return;
    }
    const generated = useCase.buildHints(currentPassage);
    setHints(generated);
    setUsedHint(true);
  }, [currentPassage, useCase, usedHint]);

  const submitAnswers = useCallback(() => {
    if (!currentPassage || phase !== 'playing') {
      return;
    }
    const evaluated = evaluateCurrentTurn(currentPassage, answersByIndex, usedHint);
    // Só o envio da equipe vibra acerto/erro; o tempo esgotado já tem a vibração própria.
    const allCorrect = evaluated.every((result) => result.isCorrect);
    void gameFeedback.notifyAnswer(allCorrect ? 'correct' : 'wrong');
  }, [answersByIndex, currentPassage, evaluateCurrentTurn, gameFeedback, phase, usedHint]);

  const nextTurn = useCallback(async () => {
    if (!currentTeam) {
      return;
    }

    setError(null);
    const pointsEarned = sumResultPoints(results);

    try {
      if (pointsEarned > 0) {
        await useCase.recordTeamScore(currentTeam.id, pointsEarned);
        setTeams((prev) =>
          prev.map((team) =>
            team.id === currentTeam.id
              ? { ...team, score: team.score + pointsEarned }
              : team
          )
        );
      }

      setSessionScoresByTeamId((prev) => ({
        ...prev,
        [currentTeam.id]: (prev[currentTeam.id] ?? 0) + pointsEarned,
      }));

      const nextIndex = currentPassageIndex + 1;
      if (nextIndex >= passages.length) {
        setPhase('finished');
        return;
      }

      setCurrentPassageIndex(nextIndex);
      setAnswersByIndex({});
      setUsedHint(false);
      setHints([]);
      setResults([]);
      setSecondsRemaining(durationSeconds);
      setPhase('handoff');
    } catch (err) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível salvar a pontuação da equipe.');
      }
    }
  }, [
    currentPassageIndex,
    currentTeam,
    durationSeconds,
    passages.length,
    results,
    useCase,
  ]);

  const restartMatch = useCallback(() => {
    setError(null);
    setPassages([]);
    setCurrentPassageIndex(0);
    setAnswersByIndex({});
    setUsedHint(false);
    setHints([]);
    setResults([]);
    setSecondsRemaining(durationSeconds);
    setPhase('setup');
  }, [durationSeconds]);

  const requestExit = useCallback(() => {
    setExitConfirmVisible(true);
  }, []);

  const cancelExit = useCallback(() => {
    setExitConfirmVisible(false);
  }, []);

  const confirmExit = useCallback(() => {
    setExitConfirmVisible(false);
    router.replace('/');
  }, [router]);

  const goToTeams = useCallback(() => {
    router.push('/teams');
  }, [router]);

  const goToScoreboard = useCallback(() => {
    router.replace('/scoreboard');
  }, [router]);

  return [
    {
      reduceMotion,
      loading,
      error,
      phase,
      teams,
      selectedPacks,
      durationSeconds,
      passagesPerTeam,
      passages,
      currentPassageIndex,
      currentPassage,
      currentTeam,
      secondsRemaining,
      activeBlankIndex,
      answersByIndex,
      usedHint,
      hints,
      results,
      turnPoints,
      sessionScoresByTeamId,
      exitConfirmVisible,
    },
    {
      setReduceMotion: setReduceMotionValue,
      reloadTeams,
      togglePack,
      selectDuration,
      selectPassagesPerTeam,
      startMatch,
      startTurn,
      selectBlank,
      setAnswer,
      revealHint,
      submitAnswers,
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
