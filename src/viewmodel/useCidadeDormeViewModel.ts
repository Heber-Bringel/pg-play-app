import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  cidadeDormeUseCases,
  isSupabaseMultiplayerEnabled,
} from '@/di/container';
import type {
  CidadeDormeConfig,
  CidadeDormePlayer,
  CidadeDormeRole,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { DomainError } from '@/model/errors';
import type {
  CidadeDormeRoleMetadata,
  ICidadeDormeUseCases,
} from '@/usecase/iCidadeDormeUseCases';

export type CidadeDormeState = {
  room: CidadeDormeRoom | null;
  currentPlayerId: string | null;
  currentPlayer: CidadeDormePlayer | null;
  currentRoleMeta: CidadeDormeRoleMetadata | null;
  isCurrentPlayerHost: boolean;
  isRealtimeEnabled: boolean;
  isNightPhase: boolean;
  isRoleVisible: boolean;
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
  handleJoinDemoRoom: () => Promise<boolean>;
  handleAddPlayer: (nickname: string) => Promise<boolean>;
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
  handleAutoAdvanceNightTurn: () => Promise<void>;
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

export function useCidadeDormeViewModel(
  useCase: ICidadeDormeUseCases = cidadeDormeUseCases
): [CidadeDormeState, CidadeDormeActions] {
  const router = useRouter();

  const [room, setRoom] = useState<CidadeDormeRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isRoleVisible, setIsRoleVisible] = useState<boolean>(false);
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

  const syncPhaseTimerAndSelection = useCallback(
    (nextRoom: CidadeDormeRoom) => {
      const phaseKey = `${nextRoom.currentRound}:${nextRoom.phase}`;
      if (lastPhaseKeyRef.current !== phaseKey) {
        lastPhaseKeyRef.current = phaseKey;
        setSelectedNightTargetId(null);
        setSelectedVoteTargetId(null);
        setSecondsRemaining(getPhaseDurationSeconds(nextRoom));
        if (nextRoom.phase !== 'role_reveal') {
          setIsRoleVisible(false);
        }
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
          setError('Não foi possível criar a sala de Cidade Dorme.');
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

  const handleAddPlayer = useCallback(
    async (nickname: string): Promise<boolean> => {
      if (!room) return false;
      try {
        setError(null);
        const updated = await useCase.addPlayer(room.id, nickname);
        setRoom(updated);
        return true;
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível adicionar o participante.');
        }
        return false;
      }
    },
    [room, useCase]
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
    async (markAllReady = !isSupabaseMultiplayerEnabled): Promise<void> => {
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
        const updated = await useCase.submitAssassinTarget(room.id, chosen);
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
    [room, selectedNightTargetId, syncPhaseTimerAndSelection, useCase]
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
        const updated = await useCase.submitAngelProtection(room.id, chosen);
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
    [room, selectedNightTargetId, syncPhaseTimerAndSelection, useCase]
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
          chosen
        );
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível investigar o suspeito.');
        }
      }
    },
    [room, selectedNightTargetId, useCase]
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

  const handleAutoAdvanceNightTurn = useCallback(async (): Promise<void> => {
    if (!room) return;
    try {
      setError(null);
      const updated = await useCase.autoAdvanceNightTurn(room.id);
      syncPhaseTimerAndSelection(updated);
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível avançar o turno da noite.');
      }
    }
  }, [room, syncPhaseTimerAndSelection, useCase]);

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
      const hasVotes = Object.keys(room.votesByPlayerId).length > 0;
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

  // Cronômetro regressivo para turnos da Noite e Debate do Dia (RF10)
  useEffect(() => {
    if (!room) return;
    const isTimedPhase =
      isPhaseNight(room.phase) || room.phase === 'day_debate';
    if (!isTimedPhase) return;

    const timerId = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [room]);

  const handleRequestExit = useCallback((): void => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback((): void => {
    setConfirmingExit(false);
  }, []);

  const handleExitArena = useCallback((): void => {
    setConfirmingExit(false);
    router.push('/');
  }, [router]);

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
    ? room.players.find((p) => p.id === activePlayerId) ??
      room.players[0] ??
      null
    : null;

  const currentRoleMeta: CidadeDormeRoleMetadata | null = currentPlayer
    ? useCase.getRoleMetadata(currentPlayer.role)
    : null;

  const isCurrentPlayerHost = Boolean(
    room && (!currentPlayerId || room.hostId === currentPlayerId)
  );

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
    handleJoinDemoRoom,
    handleAddPlayer,
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
