import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { adedonhaUseCases } from '@/di/container';
import type {
  AdedonhaAwards,
  AdedonhaConfig,
  AdedonhaPlayer,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
} from '@/model/entities/multiplayerSession';
import { DomainError } from '@/model/errors';
import type { IAdedonhaUseCases } from '@/usecase/iAdedonhaUseCases';

export type AdedonhaState = {
  room: AdedonhaRoom | null;
  loading: boolean;
  error: string | null;
  suggestedColumns: string[];
  availableLetters: string[];
  answers: Record<string, string>;
  fieldErrors: Record<string, string | null>;
  canTriggerAdedonha: boolean;
  secondsRemaining: number;
  currentTallyColumnName: string | null;
  currentColumnSubmissions: AdedonhaSubmission[];
  rankedPlayers: AdedonhaPlayer[];
  awards: AdedonhaAwards;
};

export type AdedonhaActions = {
  handleAddColumn: (columnName: string) => Promise<boolean>;
  handleRemoveColumn: (columnName: string) => Promise<void>;
  handleUpdateConfig: (
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ) => Promise<void>;
  handleSpinRoulette: (preferredLetter?: string) => Promise<void>;
  handleChangeAnswer: (columnName: string, value: string) => void;
  handleTriggerAdedonha: () => Promise<void>;
  handleTimeOut: () => Promise<void>;
  handleRaiseDoubt: (submissionId: string) => Promise<void>;
  handleJudgeSubmission: (
    submissionId: string,
    verdict: AdedonhaTallyVerdict
  ) => Promise<void>;
  handleAdvanceTallyColumn: () => Promise<void>;
  handleAdvanceToNextRound: () => Promise<void>;
  handleGoToScoreboard: () => void;
  handleExitArena: () => void;
  handleRetry: () => Promise<void>;
};

export function useAdedonhaViewModel(
  useCase: IAdedonhaUseCases = adedonhaUseCases
): [AdedonhaState, AdedonhaActions] {
  const router = useRouter();

  const [room, setRoom] = useState<AdedonhaRoom | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);

  const loadRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentRoom = await useCase.getRoom();
      setRoom(currentRoom);
      setSecondsRemaining(currentRoom.config.roundDurationSeconds);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar a sala de Adedonha Bíblica.');
      }
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  const handleTimeOut = useCallback(async () => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.finishRoundByTimeOut(
        room.id,
        room.hostId,
        answers
      );
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível encerrar o tempo da rodada.');
      }
    }
  }, [answers, room, useCase]);

  useEffect(() => {
    if (!room || room.phase !== 'filling') {
      return;
    }

    const timerId = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          void handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [room, handleTimeOut]);

  const handleAddColumn = useCallback(
    async (columnName: string): Promise<boolean> => {
      if (!room) return false;
      try {
        setError(null);
        const updated = await useCase.addColumn(room.id, columnName);
        setRoom(updated);
        return true;
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível adicionar a coluna bíblica.');
        }
        return false;
      }
    },
    [room, useCase]
  );

  const handleRemoveColumn = useCallback(
    async (columnName: string): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.removeColumn(room.id, columnName);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível remover a coluna.');
        }
      }
    },
    [room, useCase]
  );

  const handleUpdateConfig = useCallback(
    async (
      partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
    ): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.updateConfig(room.id, partialConfig);
        setRoom(updated);
        if (partialConfig.roundDurationSeconds !== undefined) {
          setSecondsRemaining(partialConfig.roundDurationSeconds);
        }
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível atualizar os parâmetros da sala.');
        }
      }
    },
    [room, useCase]
  );

  const handleSpinRoulette = useCallback(
    async (preferredLetter?: string): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.spinRoulette(room.id, preferredLetter);
        setAnswers({});
        setSecondsRemaining(updated.config.roundDurationSeconds);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível sortear a letra da rodada.');
        }
      }
    },
    [room, useCase]
  );

  const handleChangeAnswer = useCallback(
    (columnName: string, value: string): void => {
      setError(null);
      setAnswers((prev) => ({
        ...prev,
        [columnName]: value,
      }));
    },
    []
  );

  const handleTriggerAdedonha = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.triggerAdedonha(
        room.id,
        room.hostId,
        answers
      );
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível acionar o botão ADEDONHA!');
      }
    }
  }, [answers, room, useCase]);

  const handleRaiseDoubt = useCallback(
    async (submissionId: string): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.raiseDoubt(room.id, submissionId);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível levantar dúvida sobre a resposta.');
        }
      }
    },
    [room, useCase]
  );

  const handleJudgeSubmission = useCallback(
    async (
      submissionId: string,
      verdict: AdedonhaTallyVerdict
    ): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.judgeSubmission(
          room.id,
          submissionId,
          verdict
        );
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar o veredito do Moderador.');
        }
      }
    },
    [room, useCase]
  );

  const handleAdvanceTallyColumn = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.advanceTallyColumn(room.id);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível avançar para a próxima coluna.');
      }
    }
  }, [room, useCase]);

  const handleAdvanceToNextRound = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.advanceToNextRound(room.id);
      setAnswers({});
      setSecondsRemaining(updated.config.roundDurationSeconds);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a próxima rodada.');
      }
    }
  }, [room, useCase]);

  const handleGoToScoreboard = useCallback((): void => {
    router.push('/scoreboard');
  }, [router]);

  const handleExitArena = useCallback((): void => {
    router.push('/');
  }, [router]);

  const handleRetry = useCallback(async (): Promise<void> => {
    await loadRoom();
  }, [loadRoom]);

  const suggestedColumns = useCase.getSuggestedColumns();
  const availableLetters = room ? useCase.getAvailableLetters(room) : [];

  const fieldErrors: Record<string, string | null> = {};
  if (room) {
    for (const col of room.config.columns) {
      fieldErrors[col] = useCase.validateAnswerInitial(
        answers[col] ?? '',
        room.currentLetter
      );
    }
  }

  const canTriggerAdedonha = room
    ? useCase.canTriggerStop(
        room.config.columns,
        answers,
        room.currentLetter
      )
    : false;

  const currentTallyColumnName: string | null = room
    ? room.config.columns[room.currentTallyColumnIndex] ?? null
    : null;

  const currentColumnSubmissions: AdedonhaSubmission[] =
    room && currentTallyColumnName
      ? room.submissions.filter(
          (s) =>
            s.roundNumber === room.currentRound &&
            s.columnName === currentTallyColumnName
        )
      : [];

  const rankedPlayers: AdedonhaPlayer[] = room
    ? [...room.players].sort((a, b) => b.score - a.score)
    : [];

  const awards: AdedonhaAwards = room
    ? useCase.getAwards(room)
    : {
        generalChampion: null,
        fastestHand: null,
        rareVocabulary: null,
      };

  const state: AdedonhaState = {
    room,
    loading,
    error,
    suggestedColumns,
    availableLetters,
    answers,
    fieldErrors,
    canTriggerAdedonha,
    secondsRemaining,
    currentTallyColumnName,
    currentColumnSubmissions,
    rankedPlayers,
    awards,
  };

  const actions: AdedonhaActions = {
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateConfig,
    handleSpinRoulette,
    handleChangeAnswer,
    handleTriggerAdedonha,
    handleTimeOut,
    handleRaiseDoubt,
    handleJudgeSubmission,
    handleAdvanceTallyColumn,
    handleAdvanceToNextRound,
    handleGoToScoreboard,
    handleExitArena,
    handleRetry,
  };

  return [state, actions];
}
