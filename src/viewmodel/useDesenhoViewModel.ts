import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  desenhoUseCases,
  gameFeedbackUseCases,
  isSupabaseMultiplayerEnabled,
} from '@/di/container';
import type {
  DesenhoCategory,
  DrawingElement,
  DrawingElementDraft,
  DrawingFillMode,
  DrawingPenColorId,
  DrawingStrokeWidthId,
  DrawingToolId,
} from '@/model/entities/drawingChallenge';
import type {
  DesenhoAwards,
  DesenhoPlayer,
  DesenhoRoom,
  DesenhoTurnDuration,
} from '@/model/entities/multiplayerSession';
import { DomainError } from '@/model/errors';
import type { IDesenhoUseCases } from '@/usecase/iDesenhoUseCases';
import type { IGameFeedbackUseCases } from '@/usecase/iGameFeedbackUseCases';

export const DESENHO_THEME_INITIAL_SECONDS = 5;
export const DESENHO_THEME_PEEK_SECONDS = 3;

export const ALL_DESENHO_CATEGORIES: DesenhoCategory[] = [
  'Bíblico',
  'Animais',
  'Objetos',
  'Comidas',
  'Lugares e Natureza',
];

export type DesenhoState = {
  room: DesenhoRoom | null;
  currentPlayerId: string | null;
  currentPlayer: DesenhoPlayer | null;
  currentDrawer: DesenhoPlayer | null;
  isCurrentPlayerHost: boolean;
  isCurrentPlayerDrawer: boolean;
  isRealtimeEnabled: boolean;
  reduceMotion: boolean;
  secondsRemaining: number;
  themeBannerSecondsLeft: number;
  isThemeBannerVisible: boolean;
  isPeekingTheme: boolean;
  isCanvasExpanded: boolean;
  selectedTool: DrawingToolId;
  selectedFillMode: DrawingFillMode;
  selectedColor: DrawingPenColorId;
  selectedWidth: DrawingStrokeWidthId;
  guessDraft: string;
  guessFeedback: string | null;
  rankedPlayers: DesenhoPlayer[];
  awards: DesenhoAwards;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
  categoryWarning: string | null;
};

export type DesenhoActions = {
  handleSetReduceMotion: (enabled: boolean) => void;
  handleCreateRoom: (hostNickname: string) => Promise<boolean>;
  handleJoinRoom: (code: string, nickname: string) => Promise<boolean>;
  handleJoinDemoRoom: () => Promise<boolean>;
  handleSelectDuration: (seconds: DesenhoTurnDuration) => Promise<void>;
  handleSelectRounds: (rounds: number) => Promise<void>;
  handleToggleCategory: (category: DesenhoCategory) => Promise<void>;
  handleStartMatch: () => Promise<void>;
  handleSelectTool: (tool: DrawingToolId) => void;
  handleSelectFillMode: (fillMode: DrawingFillMode) => void;
  handleSelectColor: (colorId: DrawingPenColorId) => void;
  handleSelectWidth: (widthId: DrawingStrokeWidthId) => void;
  handleCompleteElement: (draft: DrawingElementDraft) => Promise<void>;
  handleUndoElement: () => Promise<void>;
  handleClearCanvas: () => Promise<void>;
  handlePeekWord: () => void;
  handleChangeGuessDraft: (text: string) => void;
  handleSubmitGuess: () => Promise<void>;
  handleTick: () => void;
  handleFinishTurn: () => Promise<void>;
  handleAdvanceTurn: () => Promise<void>;
  handleRestartLobby: () => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => Promise<void>;
  handleRetry: () => Promise<void>;
};

const EMPTY_AWARDS: DesenhoAwards = {
  generalChampion: null,
  bestArtist: null,
  eagleEye: null,
};

function computeSecondsFromEndsAt(
  phaseEndsAt: string | null,
  fallbackSeconds: number
): number {
  if (!phaseEndsAt) {
    return fallbackSeconds;
  }
  const diffMs = new Date(phaseEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 1000));
}

export function useDesenhoViewModel(
  useCase: IDesenhoUseCases = desenhoUseCases,
  gameFeedback: IGameFeedbackUseCases = gameFeedbackUseCases
): [DesenhoState, DesenhoActions] {
  const router = useRouter();

  const [room, setRoom] = useState<DesenhoRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [themeBannerSecondsLeft, setThemeBannerSecondsLeft] =
    useState<number>(0);
  const [isPeekingTheme, setIsPeekingTheme] = useState<boolean>(false);

  const [selectedTool, setSelectedTool] = useState<DrawingToolId>('freehand');
  const [selectedFillMode, setSelectedFillMode] =
    useState<DrawingFillMode>('stroke');
  const [selectedColor, setSelectedColor] = useState<DrawingPenColorId>('ink');
  const [selectedWidth, setSelectedWidth] =
    useState<DrawingStrokeWidthId>('thin');

  const [guessDraft, setGuessDraft] = useState<string>('');
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null);
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryWarning, setCategoryWarning] = useState<string | null>(null);

  const previousSecondsRef = useRef<number>(secondsRemaining);
  const lastTurnKeyRef = useRef<string | null>(null);
  const timedOutTurnKeyRef = useRef<string | null>(null);
  const lastVersionRef = useRef<number>(-1);
  const roomRef = useRef<DesenhoRoom | null>(room);
  roomRef.current = room;
  const pendingElementsRef = useRef<DrawingElement[]>([]);
  const optimisticCounterRef = useRef<number>(0);

  const roomId = room?.id ?? null;
  const roomPhase = room?.phase ?? null;
  const roomPhaseEndsAt = room?.phaseEndsAt ?? null;
  const roomTurnDuration = room?.config.turnDurationSeconds ?? 90;

  const mergePendingElements = useCallback(
    (incoming: DesenhoRoom): DesenhoRoom => {
      if (
        incoming.phase !== 'drawing' ||
        pendingElementsRef.current.length === 0
      ) {
        return incoming;
      }
      const existingIds = new Set(incoming.elements.map((el) => el.id));
      const stillPending = pendingElementsRef.current.filter(
        (el) => !existingIds.has(el.id)
      );
      if (stillPending.length === 0) {
        return incoming;
      }
      return {
        ...incoming,
        elements: [...incoming.elements, ...stillPending],
      };
    },
    []
  );

  const currentPlayer: DesenhoPlayer | null = useMemo(
    () => room?.players.find((p) => p.id === currentPlayerId) ?? null,
    [room, currentPlayerId]
  );

  const currentDrawer: DesenhoPlayer | null = useMemo(
    () => room?.players.find((p) => p.id === room.currentDrawerId) ?? null,
    [room]
  );

  const isCurrentPlayerHost = Boolean(
    room && currentPlayerId && room.hostId === currentPlayerId
  );
  const isCurrentPlayerDrawer = Boolean(
    room && currentPlayerId && room.currentDrawerId === currentPlayerId
  );

  const currentTurnKey =
    room && room.phase === 'drawing'
      ? `${room.id}:${room.currentRound}:${room.currentDrawerIndex}:${room.currentDrawerId ?? ''}`
      : null;

  useEffect(() => {
    const previousSeconds = previousSecondsRef.current;
    previousSecondsRef.current = secondsRemaining;
    if (
      room?.phase === 'drawing' ||
      (room?.phase === 'turn_summary' &&
        previousSeconds > 0 &&
        secondsRemaining === 0)
    ) {
      void gameFeedback.notifyTimerTick(previousSeconds, secondsRemaining, {
        reduceMotion,
      });
    }
  }, [secondsRemaining, reduceMotion, gameFeedback, room?.phase]);

  useEffect(() => {
    if (roomPhase !== 'drawing' || !currentTurnKey) {
      lastTurnKeyRef.current = null;
      timedOutTurnKeyRef.current = null;
      pendingElementsRef.current = [];
      setThemeBannerSecondsLeft(0);
      setIsPeekingTheme(false);
      return;
    }

    if (lastTurnKeyRef.current !== currentTurnKey) {
      lastTurnKeyRef.current = currentTurnKey;
      timedOutTurnKeyRef.current = null;
      pendingElementsRef.current = [];
      setGuessDraft('');
      setGuessFeedback(null);
      setSecondsRemaining(
        computeSecondsFromEndsAt(roomPhaseEndsAt, roomTurnDuration)
      );
      if (isCurrentPlayerDrawer) {
        setIsPeekingTheme(false);
        setThemeBannerSecondsLeft(DESENHO_THEME_INITIAL_SECONDS);
      } else {
        setIsPeekingTheme(false);
        setThemeBannerSecondsLeft(0);
      }
    }
  }, [
    roomPhase,
    roomPhaseEndsAt,
    roomTurnDuration,
    currentTurnKey,
    isCurrentPlayerDrawer,
  ]);

  const hasThemeCountdown =
    room?.phase === 'drawing' && themeBannerSecondsLeft > 0;

  useEffect(() => {
    if (!hasThemeCountdown) {
      return undefined;
    }
    const timerId = setInterval(() => {
      setThemeBannerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsPeekingTheme(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [hasThemeCountdown]);

  useEffect(() => {
    if (!roomId) {
      return undefined;
    }
    const unsubscribe = useCase.subscribeToRoom(roomId, (updatedRoom) => {
      if (updatedRoom.version < lastVersionRef.current) {
        return;
      }
      lastVersionRef.current = updatedRoom.version;
      setRoom(mergePendingElements(updatedRoom));
    });
    return unsubscribe;
  }, [roomId, useCase, mergePendingElements]);

  const applyRoomState = useCallback(
    async (loadedRoom: DesenhoRoom) => {
      const localId = await useCase.getLocalPlayerId(loadedRoom.id);
      lastVersionRef.current = loadedRoom.version;
      setCurrentPlayerId(localId ?? loadedRoom.hostId);
      setRoom(loadedRoom);
      setSecondsRemaining(
        computeSecondsFromEndsAt(
          loadedRoom.phaseEndsAt,
          loadedRoom.config.turnDurationSeconds
        )
      );
    },
    [useCase]
  );

  const handleSetReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotionState(enabled);
  }, []);

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
          setError('Não foi possível criar a sala de Desenho Relâmpago.');
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
          setError('Não foi possível entrar na sala de Desenho Relâmpago.');
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
      const demo = await useCase.getRoom();
      await applyRoomState(demo);
      return true;
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível abrir a sala de demonstração.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [applyRoomState, useCase]);

  const handleSelectDuration = useCallback(
    async (seconds: DesenhoTurnDuration) => {
      if (!room) return;
      setError(null);
      try {
        const updated = await useCase.updateConfig(room.id, {
          turnDurationSeconds: seconds,
        });
        lastVersionRef.current = updated.version;
        setRoom(updated);
        setSecondsRemaining(updated.config.turnDurationSeconds);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível atualizar o tempo por turno.');
        }
      }
    },
    [room, useCase]
  );

  const handleSelectRounds = useCallback(
    async (rounds: number) => {
      if (!room) return;
      setError(null);
      try {
        const updated = await useCase.updateConfig(room.id, {
          totalRounds: rounds,
        });
        lastVersionRef.current = updated.version;
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível atualizar a quantidade de rodadas.');
        }
      }
    },
    [room, useCase]
  );

  const handleToggleCategory = useCallback(
    async (category: DesenhoCategory) => {
      if (!room) return;
      setCategoryWarning(null);
      setError(null);
      const exists = room.config.categories.includes(category);
      const nextCategories = exists
        ? room.config.categories.filter((c) => c !== category)
        : [...room.config.categories, category];
      try {
        const updated = await useCase.updateConfig(room.id, {
          categories: nextCategories,
        });
        lastVersionRef.current = updated.version;
        setRoom(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setCategoryWarning(err.message);
        } else {
          setCategoryWarning(
            'Não foi possível atualizar os pacotes de categorias.'
          );
        }
      }
    },
    [room, useCase]
  );

  const handleStartMatch = useCallback(async () => {
    if (!room) return;
    setError(null);
    setCategoryWarning(null);
    try {
      const started = await useCase.startMatch(room.id);
      lastVersionRef.current = started.version;
      setRoom(started);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível iniciar a partida de Desenho Relâmpago.');
      }
    }
  }, [room, useCase]);

  const handleSelectTool = useCallback((tool: DrawingToolId) => {
    setSelectedTool(tool);
  }, []);

  const handleSelectFillMode = useCallback((fillMode: DrawingFillMode) => {
    setSelectedFillMode(fillMode);
  }, []);

  const handleSelectColor = useCallback((colorId: DrawingPenColorId) => {
    setSelectedColor(colorId);
  }, []);

  const handleSelectWidth = useCallback((widthId: DrawingStrokeWidthId) => {
    setSelectedWidth(widthId);
  }, []);

  const handleCompleteElement = useCallback(
    async (draft: DrawingElementDraft) => {
      const activeRoom = roomRef.current;
      if (!activeRoom || !currentPlayerId || activeRoom.phase !== 'drawing') {
        return;
      }
      if (!isCurrentPlayerDrawer || confirmingExit) return;

      const isRenderableDraft =
        draft.tool === 'freehand'
          ? draft.points.length > 0
          : Math.abs(draft.end.x - draft.start.x) >= 2 ||
            Math.abs(draft.end.y - draft.start.y) >= 2;

      let optimisticId: string | null = null;
      if (isRenderableDraft) {
        optimisticCounterRef.current += 1;
        optimisticId = `optimistic-${Date.now()}-${optimisticCounterRef.current}`;
        const optimisticElement: DrawingElement =
          draft.tool === 'freehand'
            ? {
                id: optimisticId,
                tool: 'freehand',
                points: draft.points.map((p) => ({ x: p.x, y: p.y })),
                colorId: draft.colorId,
                widthId: draft.widthId,
              }
            : {
                id: optimisticId,
                tool: draft.tool,
                start: { x: draft.start.x, y: draft.start.y },
                end: { x: draft.end.x, y: draft.end.y },
                fillMode: draft.tool === 'line' ? 'stroke' : draft.fillMode,
                colorId: draft.colorId,
                widthId: draft.widthId,
              };

        pendingElementsRef.current = [
          ...pendingElementsRef.current,
          optimisticElement,
        ];
        setRoom((prev) =>
          prev && prev.id === activeRoom.id && prev.phase === 'drawing'
            ? { ...prev, elements: [...prev.elements, optimisticElement] }
            : prev
        );
      }

      try {
        setError(null);
        const updated = await useCase.addElement(
          activeRoom.id,
          currentPlayerId,
          draft
        );
        if (optimisticId) {
          pendingElementsRef.current = pendingElementsRef.current.filter(
            (el) => el.id !== optimisticId
          );
        }
        lastVersionRef.current = Math.max(
          lastVersionRef.current,
          updated.version
        );
        setRoom(mergePendingElements(updated));
      } catch (err: unknown) {
        if (optimisticId) {
          const rollbackId = optimisticId;
          pendingElementsRef.current = pendingElementsRef.current.filter(
            (el) => el.id !== rollbackId
          );
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  elements: prev.elements.filter((el) => el.id !== rollbackId),
                }
              : prev
          );
        }
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível sincronizar o desenho.');
        }
      }
    },
    [
      currentPlayerId,
      isCurrentPlayerDrawer,
      confirmingExit,
      useCase,
      mergePendingElements,
    ]
  );

  const handleUndoElement = useCallback(async () => {
    const activeRoom = roomRef.current;
    if (!activeRoom || !currentPlayerId || !isCurrentPlayerDrawer) return;
    const previousElements = activeRoom.elements;
    if (previousElements.length > 0) {
      setRoom((prev) =>
        prev && prev.id === activeRoom.id && prev.elements.length > 0
          ? { ...prev, elements: prev.elements.slice(0, -1) }
          : prev
      );
    }
    try {
      const updated = await useCase.undoElement(activeRoom.id, currentPlayerId);
      lastVersionRef.current = Math.max(
        lastVersionRef.current,
        updated.version
      );
      setRoom(mergePendingElements(updated));
    } catch (err: unknown) {
      setRoom((prev) =>
        prev && prev.id === activeRoom.id
          ? { ...prev, elements: previousElements }
          : prev
      );
      if (err instanceof DomainError) {
        setError(err.message);
      }
    }
  }, [currentPlayerId, isCurrentPlayerDrawer, useCase, mergePendingElements]);

  const handleClearCanvas = useCallback(async () => {
    const activeRoom = roomRef.current;
    if (!activeRoom || !currentPlayerId || !isCurrentPlayerDrawer) return;
    const previousElements = activeRoom.elements;
    const previousPending = pendingElementsRef.current;
    pendingElementsRef.current = [];
    setRoom((prev) =>
      prev && prev.id === activeRoom.id ? { ...prev, elements: [] } : prev
    );
    try {
      const updated = await useCase.clearCanvas(activeRoom.id, currentPlayerId);
      lastVersionRef.current = Math.max(
        lastVersionRef.current,
        updated.version
      );
      setRoom(mergePendingElements(updated));
    } catch (err: unknown) {
      pendingElementsRef.current = previousPending;
      setRoom((prev) =>
        prev && prev.id === activeRoom.id
          ? { ...prev, elements: previousElements }
          : prev
      );
      if (err instanceof DomainError) {
        setError(err.message);
      }
    }
  }, [currentPlayerId, isCurrentPlayerDrawer, useCase, mergePendingElements]);

  const handlePeekWord = useCallback(() => {
    if (!room || room.phase !== 'drawing' || !isCurrentPlayerDrawer) return;
    setIsPeekingTheme(true);
    setThemeBannerSecondsLeft(DESENHO_THEME_PEEK_SECONDS);
  }, [room, isCurrentPlayerDrawer]);

  const handleChangeGuessDraft = useCallback((text: string) => {
    setGuessDraft(text);
    setGuessFeedback(null);
  }, []);

  const handleSubmitGuess = useCallback(async () => {
    if (!room || !currentPlayerId || room.phase !== 'drawing') return;
    setError(null);
    setGuessFeedback(null);
    try {
      const result = await useCase.submitGuess(
        room.id,
        currentPlayerId,
        guessDraft
      );
      lastVersionRef.current = result.room.version;
      setRoom(result.room);
      setGuessDraft('');
      setGuessFeedback(
        result.isCorrect
          ? `Acertou! +${result.pointsAwarded} pts`
          : 'Palpite enviado! Continue tentando.'
      );
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setGuessFeedback(err.message);
      } else {
        setGuessFeedback('Não foi possível enviar seu palpite.');
      }
    }
  }, [room, currentPlayerId, guessDraft, useCase]);

  const handleFinishTurn = useCallback(async () => {
    if (!roomId || roomPhase !== 'drawing') return;
    try {
      const updated = await useCase.finishTurn(roomId, 'timeout');
      lastVersionRef.current = updated.version;
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      }
    }
  }, [roomId, roomPhase, useCase]);

  const handleTick = useCallback(() => {
    setSecondsRemaining((prev) => {
      if (prev <= 1) {
        if (currentTurnKey && timedOutTurnKeyRef.current !== currentTurnKey) {
          timedOutTurnKeyRef.current = currentTurnKey;
          void handleFinishTurn();
        }
        return 0;
      }
      return prev - 1;
    });
  }, [currentTurnKey, handleFinishTurn]);

  useEffect(() => {
    if (roomPhase !== 'drawing' || confirmingExit) {
      return undefined;
    }
    const timerId = setInterval(() => {
      handleTick();
    }, 1000);
    return () => clearInterval(timerId);
  }, [roomPhase, confirmingExit, handleTick]);

  const handleAdvanceTurn = useCallback(async () => {
    if (!room) return;
    setError(null);
    try {
      const updated = await useCase.advanceTurn(room.id);
      lastVersionRef.current = updated.version;
      setRoom(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível avançar para o próximo desenhista.');
      }
    }
  }, [room, useCase]);

  const handleRestartLobby = useCallback(async () => {
    if (!room) return;
    setError(null);
    try {
      const restarted = await useCase.restartLobby(room.id);
      lastVersionRef.current = restarted.version;
      setRoom(restarted);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível reiniciar a sala.');
      }
    }
  }, [room, useCase]);

  const handleRequestExit = useCallback(() => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setConfirmingExit(false);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    setConfirmingExit(false);
    if (room && currentPlayerId) {
      try {
        await useCase.leaveRoom(room.id, currentPlayerId);
      } catch {
        // Ignora erro de saída ao navegar de volta ao Hub.
      }
    }
    router.replace('/');
  }, [room, currentPlayerId, useCase, router]);

  const handleRetry = useCallback(async () => {
    setError(null);
    if (!room?.id) return;
    setLoading(true);
    try {
      const refreshed = await useCase.getRoom(
        room.id,
        currentPlayerId ?? undefined
      );
      lastVersionRef.current = refreshed.version;
      setRoom(refreshed);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível recarregar a sala.');
      }
    } finally {
      setLoading(false);
    }
  }, [room?.id, currentPlayerId, useCase]);

  const isThemeBannerVisible = Boolean(
    room?.phase === 'drawing' &&
      isCurrentPlayerDrawer &&
      room.currentSecretWord &&
      themeBannerSecondsLeft > 0
  );

  // Quando o tema inicial de 5s desaparece (ou durante espiada sobreposta), o canvas se expande para ocupar a área do tema.
  const isCanvasExpanded = Boolean(
    room?.phase === 'drawing' && (!isThemeBannerVisible || isPeekingTheme)
  );

  const rankedPlayers = useMemo(
    () => (room ? useCase.getRankedPlayers(room) : []),
    [room, useCase]
  );

  const awards = useMemo(
    () => (room ? useCase.getAwards(room) : EMPTY_AWARDS),
    [room, useCase]
  );

  const state: DesenhoState = {
    room,
    currentPlayerId,
    currentPlayer,
    currentDrawer,
    isCurrentPlayerHost,
    isCurrentPlayerDrawer,
    isRealtimeEnabled: isSupabaseMultiplayerEnabled,
    reduceMotion,
    secondsRemaining,
    themeBannerSecondsLeft,
    isThemeBannerVisible,
    isPeekingTheme,
    isCanvasExpanded,
    selectedTool,
    selectedFillMode,
    selectedColor,
    selectedWidth,
    guessDraft,
    guessFeedback,
    rankedPlayers,
    awards,
    confirmingExit,
    loading,
    error,
    categoryWarning,
  };

  const actions: DesenhoActions = {
    handleSetReduceMotion,
    handleCreateRoom,
    handleJoinRoom,
    handleJoinDemoRoom,
    handleSelectDuration,
    handleSelectRounds,
    handleToggleCategory,
    handleStartMatch,
    handleSelectTool,
    handleSelectFillMode,
    handleSelectColor,
    handleSelectWidth,
    handleCompleteElement,
    handleUndoElement,
    handleClearCanvas,
    handlePeekWord,
    handleChangeGuessDraft,
    handleSubmitGuess,
    handleTick,
    handleFinishTurn,
    handleAdvanceTurn,
    handleRestartLobby,
    handleRequestExit,
    handleCancelExit,
    handleConfirmExit,
    handleRetry,
  };

  return [state, actions];
}
