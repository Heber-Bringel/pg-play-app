import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  adedonhaUseCases,
  isSupabaseMultiplayerEnabled,
} from '@/di/container';
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

const ADEDONHA_STOP_COUNTDOWN_SECONDS = 5;

export type AdedonhaState = {
  room: AdedonhaRoom | null;
  currentPlayerId: string | null;
  isCurrentPlayerHost: boolean;
  isRealtimeEnabled: boolean;
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
  confirmingExit: boolean;
};

export type AdedonhaActions = {
  handleCreateRoom: (hostNickname: string) => Promise<boolean>;
  handleJoinRoom: (code: string, nickname: string) => Promise<boolean>;
  handleJoinDemoRoom: () => Promise<boolean>;
  handleAddColumn: (columnName: string) => Promise<boolean>;
  handleRemoveColumn: (columnName: string) => Promise<void>;
  handleUpdateConfig: (
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ) => Promise<void>;
  handleSpinRoulette: (preferredLetter?: string) => Promise<void>;
  handleChangeAnswer: (columnName: string, value: string) => void;
  handleTriggerAdedonha: () => Promise<void>;
  handleFinalizeStopNow: () => Promise<void>;
  handleTimeOut: () => Promise<void>;
  handleRaiseDoubt: (submissionId: string) => Promise<void>;
  handleJudgeSubmission: (
    submissionId: string,
    verdict: AdedonhaTallyVerdict
  ) => Promise<void>;
  handleAdvanceTallyColumn: () => Promise<void>;
  handleAdvanceToNextRound: () => Promise<void>;
  handleGoToScoreboard: () => void;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleExitArena: () => void;
  handleRetry: () => Promise<void>;
};

export function useAdedonhaViewModel(
  useCase: IAdedonhaUseCases = adedonhaUseCases
): [AdedonhaState, AdedonhaActions] {
  const router = useRouter();

  const [room, setRoom] = useState<AdedonhaRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const lastRoundKeyRef = useRef<string | null>(null);
  const lastStopKeyRef = useRef<string | null>(null);
  const lastVersionRef = useRef<number>(-1);
  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

  const applyRoomState = useCallback(
    async (loadedRoom: AdedonhaRoom) => {
      const localId = await useCase.getLocalPlayerId(loadedRoom.id);
      setCurrentPlayerId(localId ?? loadedRoom.hostId);
      setRoom(loadedRoom);
      setSecondsRemaining(loadedRoom.config.roundDurationSeconds);
      lastRoundKeyRef.current = `${loadedRoom.currentRound}:${loadedRoom.currentLetter ?? ''}`;
    },
    [useCase]
  );

  const handleCreateRoom = useCallback(
    async (hostNickname: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const created = await useCase.createRoom(hostNickname);
        await applyRoomState(created);
        return true;
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível criar a sala da Adedonha Bíblica.');
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applyRoomState, useCase]
  );

  const handleJoinRoom = useCallback(
    async (code: string, nickname: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const joined = await useCase.joinRoom(code, nickname);
        await applyRoomState(joined);
        return true;
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível entrar na sala informada.');
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applyRoomState, useCase]
  );

  const handleJoinDemoRoom = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const demoRoom = await useCase.getRoom();
      await applyRoomState(demoRoom);
      return true;
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar a sala de demonstração.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [applyRoomState, useCase]);

  useEffect(() => {
    if (!room?.id) return;
    const unsubscribe = useCase.subscribeToRoom(room.id, (updatedRoom) => {
      if (updatedRoom.version < lastVersionRef.current) {
        return;
      }
      lastVersionRef.current = updatedRoom.version;
      const roundKey = `${updatedRoom.currentRound}:${updatedRoom.currentLetter ?? ''}`;
      if (
        updatedRoom.phase === 'filling' &&
        lastRoundKeyRef.current !== roundKey
      ) {
        lastRoundKeyRef.current = roundKey;
        lastStopKeyRef.current = null;
        setAnswers({});
        setSecondsRemaining(updatedRoom.config.roundDurationSeconds);
      } else if (
        updatedRoom.phase === 'stop_countdown' &&
        lastStopKeyRef.current !== roundKey
      ) {
        lastStopKeyRef.current = roundKey;
        setSecondsRemaining(ADEDONHA_STOP_COUNTDOWN_SECONDS);
      }
      setRoom(updatedRoom);
    });
    return () => unsubscribe();
  }, [room?.id, useCase]);

  const activePlayerId = currentPlayerId ?? room?.hostId ?? '';

  const handleTimeOut = useCallback(async () => {
    if (!room) return;
    try {
      setError(null);
      const isHost = !currentPlayerId || room.hostId === currentPlayerId;
      if (isHost) {
        const updated = await useCase.finishRoundByTimeOut(
          room.id,
          activePlayerId,
          answers
        );
        setRoom(updated);
      } else {
        const updated = await useCase.submitAnswers(
          room.id,
          activePlayerId,
          answers
        );
        setRoom(updated);
      }
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível encerrar o tempo da rodada.');
      }
    }
  }, [activePlayerId, answers, room, useCase]);

  const handleFinalizeStopNow = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      await useCase.submitAnswers(room.id, activePlayerId, answersRef.current);
      const updated = await useCase.finalizeStopCountdown(room.id);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a apuração da rodada.');
      }
    }
  }, [activePlayerId, room, useCase]);

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

  useEffect(() => {
    if (!room || room.phase !== 'stop_countdown') {
      return;
    }

    const timerId = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          void (async () => {
            try {
              await useCase.submitAnswers(
                room.id,
                activePlayerId,
                answersRef.current
              );
              const isHost =
                !currentPlayerId || room.hostId === currentPlayerId;
              if (isHost) {
                const updated = await useCase.finalizeStopCountdown(room.id);
                setRoom(updated);
              }
            } catch (err: unknown) {
              if (err instanceof DomainError) {
                setError(err.message);
              }
            }
          })();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activePlayerId, currentPlayerId, room, useCase]);

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
        lastRoundKeyRef.current = `${updated.currentRound}:${updated.currentLetter ?? ''}`;
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
      const updated = await useCase.startStopCountdown(
        room.id,
        activePlayerId,
        answers
      );
      lastStopKeyRef.current = `${updated.currentRound}:${updated.currentLetter ?? ''}`;
      setSecondsRemaining(ADEDONHA_STOP_COUNTDOWN_SECONDS);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível acionar o botão ADEDONHA!');
      }
    }
  }, [activePlayerId, answers, room, useCase]);

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
      lastRoundKeyRef.current = `${updated.currentRound}:${updated.currentLetter ?? ''}`;
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

  const handleRequestExit = useCallback((): void => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback((): void => {
    setConfirmingExit(false);
  }, []);

  const handleExitArena = useCallback((): void => {
    setConfirmingExit(false);
    if (room?.id && activePlayerId) {
      void useCase.leaveRoom(room.id, activePlayerId).catch(() => {
        // Falha transitória na saída não impede retorno ao Hub.
      });
    }
    setRoom(null);
    setCurrentPlayerId(null);
    setError(null);
    setAnswers({});
    router.replace('/');
  }, [activePlayerId, room?.id, router, useCase]);

  const handleRetry = useCallback(async (): Promise<void> => {
    if (!room) {
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const refreshed = await useCase.getRoom(room.id);
      await applyRoomState(refreshed);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível reconectar à sala da Adedonha Bíblica.');
      }
    } finally {
      setLoading(false);
    }
  }, [applyRoomState, room, useCase]);

  const suggestedColumns = useCase.getSuggestedColumns();
  const availableLetters = room ? useCase.getAvailableLetters(room) : [];
  const isCurrentPlayerHost = Boolean(
    room && (!currentPlayerId || room.hostId === currentPlayerId)
  );

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
    currentPlayerId,
    isCurrentPlayerHost,
    isRealtimeEnabled: isSupabaseMultiplayerEnabled,
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
    confirmingExit,
  };

  const actions: AdedonhaActions = {
    handleCreateRoom,
    handleJoinRoom,
    handleJoinDemoRoom,
    handleAddColumn,
    handleRemoveColumn,
    handleUpdateConfig,
    handleSpinRoulette,
    handleChangeAnswer,
    handleTriggerAdedonha,
    handleFinalizeStopNow,
    handleTimeOut,
    handleRaiseDoubt,
    handleJudgeSubmission,
    handleAdvanceTallyColumn,
    handleAdvanceToNextRound,
    handleGoToScoreboard,
    handleRequestExit,
    handleCancelExit,
    handleExitArena,
    handleRetry,
  };

  return [state, actions];
}
