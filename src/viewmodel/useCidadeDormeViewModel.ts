import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  cidadeDormeUseCases,
  isSupabaseMultiplayerEnabled,
} from '@/di/container';
import type {
  CidadeDormeConfig,
  CidadeDormePhase,
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { DataSourceError, DomainError } from '@/model/errors';
import type {
  CidadeDormeRoleMetadata,
  ICidadeDormeUseCases,
} from '@/usecase/iCidadeDormeUseCases';

const CONNECTION_TIMEOUT_MS = 10_000;

export type CidadeDormeState = {
  room: CidadeDormeRoom | null;
  currentPlayerId: string | null;
  currentPlayer: CidadeDormePlayer | null;
  currentRoleMeta: CidadeDormeRoleMetadata | null;
  isCurrentPlayerHost: boolean;
  isRealtimeEnabled: boolean;
  isNightPhase: boolean;
  isRoleVisible: boolean;
  hasSubmittedNightAction: boolean;
  selectedNightTargetId: string | null;
  selectedVoteTargetId: string | null;
  secondsRemaining: number;
  loading: boolean;
  error: string | null;
  confirmingExit: boolean;
};

export type CidadeDormeActions = {
  handleCreateRoom: (hostNickname: string) => Promise<boolean>;
  handleJoinRoom: (code: string, nickname: string) => Promise<boolean>;
  handleRemovePlayer: (playerId: string) => Promise<void>;
  handleUpdateConfig: (
    partialConfig: Partial<CidadeDormeConfig>
  ) => Promise<void>;
  handleStartMatch: (preferredRoles?: CidadeDormeRole[]) => Promise<void>;
  handleToggleRoleVisibility: () => void;
  handleConfirmRoleReady: (markAllReady?: boolean) => Promise<void>;
  handleSelectNightTarget: (targetPlayerId: string) => void;
  handleConfirmAssassinTarget: (targetPlayerId?: string) => Promise<void>;
  handleConfirmAngelProtection: (
    protectedPlayerId?: string | null
  ) => Promise<void>;
  handleConfirmDetectiveInvestigation: (
    suspectPlayerId?: string | null
  ) => Promise<void>;
  handleAdvanceToDawn: () => Promise<void>;
  handleAutoAdvanceNightTurn: (
    expectedPhase?: CidadeDormePhase,
    expectedRound?: number
  ) => Promise<void>;
  handleStartVotingPhase: () => Promise<void>;
  handleSelectVoteTarget: (targetIdOrSkip: string) => void;
  handleCastVote: (targetIdOrSkip?: string) => Promise<void>;
  handleTallyVotes: () => Promise<void>;
  handleStartNextNight: () => Promise<void>;
  handleRestartMatch: () => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleExitArena: () => void;
  handleRetry: () => Promise<void>;
};

function isPhaseNight(phase: CidadeDormeRoom['phase'] | undefined): boolean {
  return (
    phase === 'night_assassin' ||
    phase === 'night_angel' ||
    phase === 'night_detective'
  );
}

function getPhaseDurationSeconds(room: CidadeDormeRoom): number {
  if (isPhaseNight(room.phase)) {
    return room.config.nightTurnSeconds;
  }
  if (room.phase === 'day_debate') {
    return room.config.dayDebateSeconds;
  }
  return room.config.nightTurnSeconds;
}

function computeSecondsRemaining(room: CidadeDormeRoom): number {
  if (room.phaseEndsAt) {
    const endsAtMs = Date.parse(room.phaseEndsAt);
    if (!Number.isNaN(endsAtMs)) {
      return Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
    }
  }
  return getPhaseDurationSeconds(room);
}

export function useCidadeDormeViewModel(
  useCase: ICidadeDormeUseCases = cidadeDormeUseCases
): [CidadeDormeState, CidadeDormeActions] {
  const router = useRouter();

  const [room, setRoom] = useState<CidadeDormeRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isRoleVisible, setIsRoleVisible] = useState<boolean>(false);
  const [hasSubmittedNightAction, setHasSubmittedNightAction] =
    useState<boolean>(false);
  const [selectedNightTargetId, setSelectedNightTargetId] = useState<
    string | null
  >(null);
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState<
    string | null
  >(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);

  const lastPhaseKeyRef = useRef<string | null>(null);
  const lastSpokenKeyRef = useRef<string | null>(null);
  const autoAdvancedPhaseKeyRef = useRef<string | null>(null);
  const activeTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    const timeouts = activeTimeoutsRef.current;
    return () => {
      isMountedRef.current = false;
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  const runWithConnectionTimeout = useCallback(
    <T,>(operation: Promise<T>): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          activeTimeoutsRef.current.delete(timeoutId);
          reject(
            new DataSourceError(
              'Tempo limite de conexão excedido (10s). Verifique sua rede e tente novamente.'
            )
          );
        }, CONNECTION_TIMEOUT_MS);
        activeTimeoutsRef.current.add(timeoutId);

        operation.then(
          (result) => {
            clearTimeout(timeoutId);
            activeTimeoutsRef.current.delete(timeoutId);
            resolve(result);
          },
          (err: unknown) => {
            clearTimeout(timeoutId);
            activeTimeoutsRef.current.delete(timeoutId);
            reject(err);
          }
        );
      });
    },
    []
  );

  const syncPhaseTimerAndSelection = useCallback(
    (nextRoom: CidadeDormeRoom) => {
      const phaseKey = `${nextRoom.id}:${nextRoom.currentRound}:${nextRoom.phase}`;
      if (lastPhaseKeyRef.current !== phaseKey) {
        lastPhaseKeyRef.current = phaseKey;
        autoAdvancedPhaseKeyRef.current = null;
        setSelectedNightTargetId(null);
        setSelectedVoteTargetId(null);
        setHasSubmittedNightAction(false);
        setSecondsRemaining(computeSecondsRemaining(nextRoom));
        if (nextRoom.phase !== 'role_reveal') {
          setIsRoleVisible(false);
        }
      } else if (nextRoom.phaseEndsAt) {
        setSecondsRemaining(computeSecondsRemaining(nextRoom));
      }
    },
    []
  );

  const applyRoomState = useCallback(
    async (loadedRoom: CidadeDormeRoom) => {
      const localId = await useCase.getLocalPlayerId(loadedRoom.id);
      setCurrentPlayerId(localId ?? loadedRoom.hostId);
      syncPhaseTimerAndSelection(loadedRoom);
      setRoom(loadedRoom);
    },
    [syncPhaseTimerAndSelection, useCase]
  );

  useEffect(() => {
    if (!room?.id) return;
    const unsubscribe = useCase.subscribeToRoom(room.id, (updatedRoom) => {
      syncPhaseTimerAndSelection(updatedRoom);
      setRoom(updatedRoom);
    });
    return () => unsubscribe();
  }, [room?.id, syncPhaseTimerAndSelection, useCase]);

  const activePlayerId = currentPlayerId ?? room?.hostId ?? '';
  const isCurrentPlayerHost = Boolean(
    room && (!currentPlayerId || room.hostId === currentPlayerId)
  );

  useEffect(() => {
    if (
      !room ||
      !isCurrentPlayerHost ||
      room.phase === 'lobby' ||
      room.narratorCaption.trim().length === 0
    ) {
      return;
    }

    const speechKey = `${room.id}:${room.currentRound}:${room.phase}:${room.narratorCaption}`;
    if (lastSpokenKeyRef.current !== speechKey) {
      lastSpokenKeyRef.current = speechKey;
      void useCase
        .speakNarratorCaption(room.narratorCaption, room.config.narratorVoice)
        .catch(() => {
          // Falha na síntese de voz não bloqueia a partida.
        });
    }
  }, [isCurrentPlayerHost, room, useCase]);

  useEffect(() => {
    return () => {
      void useCase.stopNarratorAudio().catch(() => {
        // Ignora falha ao parar o áudio ao desmontar a tela.
      });
    };
  }, [useCase]);

  const handleCreateRoom = useCallback(
    async (hostNickname: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const created = await runWithConnectionTimeout(
          useCase.createRoom(hostNickname)
        );
        if (!isMountedRef.current) return false;
        await applyRoomState(created);
        return true;
      } catch (err: unknown) {
        if (!isMountedRef.current) return false;
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível criar a sala de Cidade Dorme.');
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [applyRoomState, runWithConnectionTimeout, useCase]
  );

  const handleJoinRoom = useCallback(
    async (code: string, nickname: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const joined = await runWithConnectionTimeout(
          useCase.joinRoom(code, nickname)
        );
        if (!isMountedRef.current) return false;
        await applyRoomState(joined);
        return true;
      } catch (err: unknown) {
        if (!isMountedRef.current) return false;
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível entrar na sala informada.');
        }
        return false;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [applyRoomState, runWithConnectionTimeout, useCase]
  );

  const handleRemovePlayer = useCallback(
    async (playerId: string): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.removePlayer(room.id, playerId);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível remover o participante.');
        }
      }
    },
    [room, useCase]
  );

  const handleUpdateConfig = useCallback(
    async (partialConfig: Partial<CidadeDormeConfig>): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.updateConfig(room.id, partialConfig);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível atualizar as configurações da sala.');
        }
      }
    },
    [room, useCase]
  );

  const handleStartMatch = useCallback(
    async (preferredRoles?: CidadeDormeRole[]): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const started = await useCase.startMatch(room.id, preferredRoles);
        setIsRoleVisible(false);
        syncPhaseTimerAndSelection(started);
        setRoom(started);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível distribuir os papéis da partida.');
        }
      }
    },
    [room, syncPhaseTimerAndSelection, useCase]
  );

  const handleToggleRoleVisibility = useCallback((): void => {
    setIsRoleVisible((prev) => !prev);
  }, []);

  const handleConfirmRoleReady = useCallback(
    async (markAllReady = false): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        setIsRoleVisible(false);
        const updated = await useCase.confirmPlayerReady(
          room.id,
          activePlayerId,
          markAllReady
        );
        syncPhaseTimerAndSelection(updated);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível confirmar a visualização do papel.');
        }
      }
    },
    [activePlayerId, room, syncPhaseTimerAndSelection, useCase]
  );

  const handleSelectNightTarget = useCallback(
    (targetPlayerId: string): void => {
      setError(null);
      setSelectedNightTargetId(targetPlayerId);
    },
    []
  );

  const handleConfirmAssassinTarget = useCallback(
    async (targetPlayerId?: string): Promise<void> => {
      if (!room) return;
      const chosen = targetPlayerId ?? selectedNightTargetId ?? '';
      try {
        setError(null);
        const updated = await useCase.submitAssassinTarget(
          room.id,
          activePlayerId,
          chosen
        );
        setHasSubmittedNightAction(true);
        syncPhaseTimerAndSelection(updated);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar o alvo do Assassino.');
        }
      }
    },
    [activePlayerId, room, selectedNightTargetId, syncPhaseTimerAndSelection, useCase]
  );

  const handleConfirmAngelProtection = useCallback(
    async (protectedPlayerId?: string | null): Promise<void> => {
      if (!room) return;
      const chosen =
        protectedPlayerId !== undefined
          ? protectedPlayerId
          : selectedNightTargetId;
      try {
        setError(null);
        const updated = await useCase.submitAngelProtection(
          room.id,
          activePlayerId,
          chosen
        );
        setHasSubmittedNightAction(true);
        syncPhaseTimerAndSelection(updated);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar a proteção do Anjo.');
        }
      }
    },
    [activePlayerId, room, selectedNightTargetId, syncPhaseTimerAndSelection, useCase]
  );

  const handleConfirmDetectiveInvestigation = useCallback(
    async (suspectPlayerId?: string | null): Promise<void> => {
      if (!room) return;
      const chosen =
        suspectPlayerId !== undefined ? suspectPlayerId : selectedNightTargetId;
      try {
        setError(null);
        const updated = await useCase.submitDetectiveInvestigation(
          room.id,
          activePlayerId,
          chosen
        );
        setHasSubmittedNightAction(true);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível investigar o suspeito.');
        }
      }
    },
    [activePlayerId, room, selectedNightTargetId, useCase]
  );

  const handleAdvanceToDawn = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.advanceToDawn(room.id);
      syncPhaseTimerAndSelection(updated);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível avançar para o amanhecer.');
      }
    }
  }, [room, syncPhaseTimerAndSelection, useCase]);

  const handleAutoAdvanceNightTurn = useCallback(
    async (
      expectedPhase?: CidadeDormePhase,
      expectedRound?: number
    ): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.autoAdvanceNightTurn(
          room.id,
          expectedPhase,
          expectedRound
        );
        syncPhaseTimerAndSelection(updated);
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível avançar o turno da noite.');
        }
      }
    },
    [room, syncPhaseTimerAndSelection, useCase]
  );

  const handleStartVotingPhase = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.startVotingPhase(room.id);
      syncPhaseTimerAndSelection(updated);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a fase de votação.');
      }
    }
  }, [room, syncPhaseTimerAndSelection, useCase]);

  const handleSelectVoteTarget = useCallback((targetIdOrSkip: string): void => {
    setError(null);
    setSelectedVoteTargetId(targetIdOrSkip);
  }, []);

  const handleCastVote = useCallback(
    async (targetIdOrSkip?: string): Promise<void> => {
      if (!room) return;
      const chosen = targetIdOrSkip ?? selectedVoteTargetId ?? '';
      try {
        setError(null);
        const updated = await useCase.castVote(
          room.id,
          activePlayerId,
          chosen
        );
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar seu voto.');
        }
      }
    },
    [activePlayerId, room, selectedVoteTargetId, useCase]
  );

  const handleTallyVotes = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const hasVotes =
        room.players.some((p) => p.hasVoted) ||
        Object.keys(room.votesByPlayerId).length > 0;
      if (!hasVotes && selectedVoteTargetId) {
        await useCase.castVote(room.id, activePlayerId, selectedVoteTargetId);
      }
      const updated = await useCase.tallyVotes(room.id);
      syncPhaseTimerAndSelection(updated);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível apurar os votos da cidade.');
      }
    }
  }, [
    activePlayerId,
    room,
    selectedVoteTargetId,
    syncPhaseTimerAndSelection,
    useCase,
  ]);

  const handleStartNextNight = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.startNextNight(room.id);
      syncPhaseTimerAndSelection(updated);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a próxima noite.');
      }
    }
  }, [room, syncPhaseTimerAndSelection, useCase]);

  const handleRestartMatch = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const restarted = await useCase.restartMatch(room.id);
      setIsRoleVisible(false);
      syncPhaseTimerAndSelection(restarted);
      setRoom(restarted);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a revanche.');
      }
    }
  }, [room, syncPhaseTimerAndSelection, useCase]);

  // Cronômetro regressivo sincronizado com phaseEndsAt para turnos da Noite e Debate do Dia (RF10)
  useEffect(() => {
    if (!room) return;
    const isTimedPhase =
      isPhaseNight(room.phase) || room.phase === 'day_debate';
    if (!isTimedPhase) return;

    const updateCountdown = () => {
      if (room.phaseEndsAt) {
        setSecondsRemaining(computeSecondsRemaining(room));
        return;
      }
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    };

    if (room.phaseEndsAt) {
      updateCountdown();
    }

    const timerId = setInterval(updateCountdown, 1000);
    return () => clearInterval(timerId);
  }, [room]);

  // Avanço automático único da Noite no aparelho do Anfitrião quando o tempo chega a 00:00 (RF19 / RNF11)
  useEffect(() => {
    if (
      !room ||
      !isCurrentPlayerHost ||
      !isPhaseNight(room.phase) ||
      secondsRemaining > 0
    ) {
      return;
    }

    const phaseKey = `${room.id}:${room.currentRound}:${room.phase}`;
    if (autoAdvancedPhaseKeyRef.current === phaseKey) {
      return;
    }
    autoAdvancedPhaseKeyRef.current = phaseKey;
    void handleAutoAdvanceNightTurn(room.phase, room.currentRound);
  }, [
    handleAutoAdvanceNightTurn,
    isCurrentPlayerHost,
    room,
    secondsRemaining,
  ]);

  const handleRequestExit = useCallback((): void => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback((): void => {
    setConfirmingExit(false);
  }, []);

  const handleExitArena = useCallback((): void => {
    setConfirmingExit(false);
    lastSpokenKeyRef.current = null;
    lastPhaseKeyRef.current = null;
    autoAdvancedPhaseKeyRef.current = null;
    void useCase.stopNarratorAudio().catch(() => {
      // Falha transitória ao parar o áudio não impede retorno ao Hub.
    });
    if (room?.id && activePlayerId) {
      void useCase.leaveRoom(room.id, activePlayerId).catch(() => {
        // Falha transitória na saída não impede retorno ao Hub.
      });
    }
    setRoom(null);
    setCurrentPlayerId(null);
    setError(null);
    setIsRoleVisible(false);
    setHasSubmittedNightAction(false);
    setSelectedNightTargetId(null);
    setSelectedVoteTargetId(null);
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
        setError('Não foi possível reconectar à sala de Cidade Dorme.');
      }
    } finally {
      setLoading(false);
    }
  }, [applyRoomState, room, useCase]);

  const currentPlayer: CidadeDormePlayer | null = room
    ? room.players.find((p) => p.id === activePlayerId) ?? null
    : null;

  const currentRoleMeta: CidadeDormeRoleMetadata | null = currentPlayer?.role
    ? useCase.getRoleMetadata(currentPlayer.role)
    : null;

  const isNightPhase = isPhaseNight(room?.phase);

  const state: CidadeDormeState = {
    room,
    currentPlayerId,
    currentPlayer,
    currentRoleMeta,
    isCurrentPlayerHost,
    isRealtimeEnabled: isSupabaseMultiplayerEnabled,
    isNightPhase,
    isRoleVisible,
    hasSubmittedNightAction,
    selectedNightTargetId,
    selectedVoteTargetId,
    secondsRemaining,
    loading,
    error,
    confirmingExit,
  };

  const actions: CidadeDormeActions = {
    handleCreateRoom,
    handleJoinRoom,
    handleRemovePlayer,
    handleUpdateConfig,
    handleStartMatch,
    handleToggleRoleVisibility,
    handleConfirmRoleReady,
    handleSelectNightTarget,
    handleConfirmAssassinTarget,
    handleConfirmAngelProtection,
    handleConfirmDetectiveInvestigation,
    handleAdvanceToDawn,
    handleAutoAdvanceNightTurn,
    handleStartVotingPhase,
    handleSelectVoteTarget,
    handleCastVote,
    handleTallyVotes,
    handleStartNextNight,
    handleRestartMatch,
    handleRequestExit,
    handleCancelExit,
    handleExitArena,
    handleRetry,
  };

  return [state, actions];
}
