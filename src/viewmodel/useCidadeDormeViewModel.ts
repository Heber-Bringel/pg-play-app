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
const NIGHT_SYNC_WATCHDOG_INTERVAL_MS = 1_500;
const NIGHT_SYNC_WATCHDOG_MAX_ATTEMPTS = 4;

export type CidadeDormeTimelineStepId = 'night' | 'dawn' | 'debate' | 'voting';

export type CidadeDormeTimelineStep = {
  id: CidadeDormeTimelineStepId;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
};

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
  reduceMotion: boolean;
  phaseTimeline: CidadeDormeTimelineStep[];
  aliveCount: number;
  eliminatedCount: number;
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
  handleSetReduceMotion: (enabled: boolean) => void;
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

const TIMELINE_STEPS: Array<{ id: CidadeDormeTimelineStepId; label: string }> = [
  { id: 'night', label: 'Noite' },
  { id: 'dawn', label: 'Amanhecer' },
  { id: 'debate', label: 'Debate' },
  { id: 'voting', label: 'Votação' },
];

function buildPhaseTimeline(
  phase: CidadeDormePhase | undefined
): CidadeDormeTimelineStep[] {
  let activeIndex = -1;
  let completedUpTo = -1;

  if (isPhaseNight(phase)) {
    activeIndex = 0;
  } else if (phase === 'day_debate') {
    activeIndex = 2;
    completedUpTo = 1;
  } else if (phase === 'day_voting') {
    activeIndex = 3;
    completedUpTo = 2;
  } else if (phase === 'vote_result' || phase === 'finished') {
    completedUpTo = 3;
  }

  return TIMELINE_STEPS.map((step, index) => ({
    id: step.id,
    label: step.label,
    isActive: index === activeIndex,
    isCompleted: index <= completedUpTo,
  }));
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
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);

  const lastPhaseKeyRef = useRef<string | null>(null);
  const lastSpokenKeyRef = useRef<string | null>(null);
  const autoAdvancedPhaseKeyRef = useRef<string | null>(null);
  const currentPlayerIdRef = useRef<string | null>(null);
  const lastRoomIdRef = useRef<string | null>(null);
  const lastVersionRef = useRef<number>(-1);
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

  const acceptRoomSnapshot = useCallback(
    (nextRoom: CidadeDormeRoom, knownPlayerId?: string | null): boolean => {
      const activeId = knownPlayerId ?? currentPlayerIdRef.current;
      if (
        activeId &&
        activeId !== nextRoom.hostId &&
        !nextRoom.players.some((p) => p.id === activeId)
      ) {
        lastSpokenKeyRef.current = null;
        lastPhaseKeyRef.current = null;
        autoAdvancedPhaseKeyRef.current = null;
        lastRoomIdRef.current = null;
        lastVersionRef.current = -1;
        currentPlayerIdRef.current = null;
        void useCase.leaveRoom(nextRoom.id, activeId).catch(() => {
          // Saída em best-effort para limpar linha órfã do jogador removido.
        });
        setRoom(null);
        setCurrentPlayerId(null);
        setIsRoleVisible(false);
        setHasSubmittedNightAction(false);
        setSelectedNightTargetId(null);
        setSelectedVoteTargetId(null);
        setError('Você foi removido da sala pelo Moderador.');
        return false;
      }

      const nextVersion = nextRoom.version ?? 0;
      if (lastRoomIdRef.current !== nextRoom.id) {
        lastRoomIdRef.current = nextRoom.id;
        lastVersionRef.current = nextVersion;
      } else if (nextVersion < lastVersionRef.current) {
        return false;
      } else {
        lastVersionRef.current = nextVersion;
      }
      syncPhaseTimerAndSelection(nextRoom);
      setRoom(nextRoom);
      return true;
    },
    [syncPhaseTimerAndSelection, useCase]
  );

  const applyRoomState = useCallback(
    async (loadedRoom: CidadeDormeRoom) => {
      const localId = await useCase.getLocalPlayerId(loadedRoom.id);
      if (!isMountedRef.current) return;
      const resolvedId = localId ?? loadedRoom.hostId;
      currentPlayerIdRef.current = resolvedId;
      setCurrentPlayerId(resolvedId);
      acceptRoomSnapshot(loadedRoom, resolvedId);
    },
    [acceptRoomSnapshot, useCase]
  );

  useEffect(() => {
    if (!room?.id) return;
    const unsubscribe = useCase.subscribeToRoom(room.id, (updatedRoom) => {
      acceptRoomSnapshot(updatedRoom);
    });
    return () => unsubscribe();
  }, [acceptRoomSnapshot, room?.id, useCase]);

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
      currentPlayerIdRef.current = null;
      lastRoomIdRef.current = null;
      lastVersionRef.current = -1;
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
      currentPlayerIdRef.current = null;
      lastRoomIdRef.current = null;
      lastVersionRef.current = -1;
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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível remover o participante.');
        }
      }
    },
    [acceptRoomSnapshot, room, useCase]
  );

  const handleUpdateConfig = useCallback(
    async (partialConfig: Partial<CidadeDormeConfig>): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const updated = await useCase.updateConfig(room.id, partialConfig);
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível atualizar as configurações da sala.');
        }
      }
    },
    [acceptRoomSnapshot, room, useCase]
  );

  const handleStartMatch = useCallback(
    async (preferredRoles?: CidadeDormeRole[]): Promise<void> => {
      if (!room) return;
      try {
        setError(null);
        const started = await useCase.startMatch(room.id, preferredRoles);
        setIsRoleVisible(false);
        acceptRoomSnapshot(started);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível distribuir os papéis da partida.');
        }
      }
    },
    [acceptRoomSnapshot, room, useCase]
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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível confirmar a visualização do papel.');
        }
      }
    },
    [acceptRoomSnapshot, activePlayerId, room, useCase]
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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar o alvo do Assassino.');
        }
      }
    },
    [acceptRoomSnapshot, activePlayerId, room, selectedNightTargetId, useCase]
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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar a proteção do Anjo.');
        }
      }
    },
    [acceptRoomSnapshot, activePlayerId, room, selectedNightTargetId, useCase]
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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível investigar o suspeito.');
        }
      }
    },
    [acceptRoomSnapshot, activePlayerId, room, selectedNightTargetId, useCase]
  );

  const handleAdvanceToDawn = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.advanceToDawn(room.id);
      acceptRoomSnapshot(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível avançar para o amanhecer.');
      }
    }
  }, [acceptRoomSnapshot, room, useCase]);

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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível avançar o turno da noite.');
        }
      }
    },
    [acceptRoomSnapshot, room, useCase]
  );

  const handleStartVotingPhase = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.startVotingPhase(room.id);
      acceptRoomSnapshot(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a fase de votação.');
      }
    }
  }, [acceptRoomSnapshot, room, useCase]);

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
        acceptRoomSnapshot(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível registrar seu voto.');
        }
      }
    },
    [acceptRoomSnapshot, activePlayerId, room, selectedVoteTargetId, useCase]
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
      acceptRoomSnapshot(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível apurar os votos da cidade.');
      }
    }
  }, [
    acceptRoomSnapshot,
    activePlayerId,
    room,
    selectedVoteTargetId,
    useCase,
  ]);

  const handleStartNextNight = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.startNextNight(room.id);
      acceptRoomSnapshot(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a próxima noite.');
      }
    }
  }, [acceptRoomSnapshot, room, useCase]);

  const handleRestartMatch = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const restarted = await useCase.restartMatch(room.id);
      setIsRoleVisible(false);
      acceptRoomSnapshot(restarted);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a revanche.');
      }
    }
  }, [acceptRoomSnapshot, room, useCase]);

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

  // Watchdog de segurança pós-phaseEndsAt para recuperar eventos Realtime perdidos (Issue #65)
  const isTimedPhaseExpired = Boolean(
    room?.id &&
      room.phaseEndsAt &&
      (isPhaseNight(room.phase) || room.phase === 'day_debate') &&
      secondsRemaining <= 0
  );

  useEffect(() => {
    if (!isTimedPhaseExpired || !room?.id) {
      return;
    }

    const watchedRoomId = room.id;
    let attempts = 0;
    const intervalId = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(intervalId);
        return;
      }
      attempts += 1;
      void useCase
        .getRoom(watchedRoomId)
        .then((refreshed) => {
          if (isMountedRef.current) {
            acceptRoomSnapshot(refreshed);
          }
        })
        .catch(() => {
          // Falha transitória na releitura não bloqueia a sessão.
        });
      if (attempts >= NIGHT_SYNC_WATCHDOG_MAX_ATTEMPTS) {
        clearInterval(intervalId);
      }
    }, NIGHT_SYNC_WATCHDOG_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [
    acceptRoomSnapshot,
    isTimedPhaseExpired,
    room?.currentRound,
    room?.id,
    room?.phase,
    useCase,
  ]);

  const handleSetReduceMotion = useCallback((enabled: boolean): void => {
    setReduceMotion(enabled);
  }, []);

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
    lastRoomIdRef.current = null;
    lastVersionRef.current = -1;
    currentPlayerIdRef.current = null;
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
  const phaseTimeline = buildPhaseTimeline(room?.phase);
  const aliveCount = room ? room.players.filter((p) => p.isAlive).length : 0;
  const eliminatedCount = room
    ? room.players.filter((p) => !p.isAlive).length
    : 0;

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
    reduceMotion,
    phaseTimeline,
    aliveCount,
    eliminatedCount,
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
    handleSetReduceMotion,
    handleRequestExit,
    handleCancelExit,
    handleExitArena,
    handleRetry,
  };

  return [state, actions];
}
