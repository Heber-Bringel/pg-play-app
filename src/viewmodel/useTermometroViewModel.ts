import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { termometroUseCases } from '@/di/container';
import type {
  TermometroDurationMinutes,
  TermometroOrderMode,
  TermometroParticipantMode,
  TermometroStage,
} from '@/model/entities/termometro';
import { DomainError } from '@/model/errors';
import type { ITermometroUseCases } from '@/usecase/iTermometroUseCases';

export type TermometroState = {
  stage: TermometroStage;
  participantMode: TermometroParticipantMode;
  durationMinutes: TermometroDurationMinutes;
  durationSeconds: number;
  orderMode: TermometroOrderMode;
  participants: string[];
  currentIndex: number;
  currentSpeakerLabel: string;
  hasStartedSpeaking: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  sharedCount: number;
  skippedCount: number;
  summaryTitle: string;
  confirmingExit: boolean;
  confirmingEndWithoutPrayer: boolean;
  loading: boolean;
  error: string | null;
  fieldError: string | null;
  setupError: string | null;
};

export type TermometroActions = {
  handleSelectParticipantMode: (mode: TermometroParticipantMode) => Promise<void>;
  handleSelectDuration: (minutes: TermometroDurationMinutes) => Promise<void>;
  handleSelectOrderMode: (order: TermometroOrderMode) => Promise<void>;
  handleAddCustomParticipant: (name: string) => Promise<boolean>;
  handleRemoveCustomParticipant: (name: string) => Promise<void>;
  handleClearFieldErrors: () => void;
  handleStartMoment: () => Promise<void>;
  handleStartSpeaking: () => Promise<void>;
  handleTick: () => Promise<void>;
  handleTogglePause: () => Promise<void>;
  handleNextSpeaker: () => Promise<void>;
  handleSkipSpeaker: () => Promise<void>;
  handleFinishFreeMode: () => Promise<void>;
  handleOpenPrayerMoment: () => Promise<void>;
  handleRequestEndFromSummary: () => void;
  handleCancelEndWithoutPrayer: () => void;
  handleEndEncounter: () => Promise<void>;
  handleBackToHub: () => Promise<void>;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => Promise<void>;
  handleRetry: () => Promise<void>;
};

export function useTermometroViewModel(
  useCases: ITermometroUseCases = termometroUseCases
): [TermometroState, TermometroActions] {
  const router = useRouter();

  const [stage, setStage] = useState<TermometroStage>('setup');
  const [participantMode, setParticipantMode] =
    useState<TermometroParticipantMode>('custom');
  const [durationMinutes, setDurationMinutes] =
    useState<TermometroDurationMinutes>(1);
  const [durationSeconds, setDurationSeconds] = useState<number>(60);
  const [orderMode, setOrderMode] = useState<TermometroOrderMode>('list');
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSpeakerLabel, setCurrentSpeakerLabel] = useState<string>('');
  const [hasStartedSpeaking, setHasStartedSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [sharedCount, setSharedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [summaryTitle, setSummaryTitle] = useState<string>(
    'Roda de pedidos concluída'
  );
  const [confirmingExit, setConfirmingExit] = useState<boolean>(false);
  const [confirmingEndWithoutPrayer, setConfirmingEndWithoutPrayer] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);

  const syncSessionState = useCallback(
    (session: Awaited<ReturnType<ITermometroUseCases['getSession']>>) => {
      setStage(session.stage);
      setParticipantMode(session.participantMode);
      setDurationMinutes(session.durationMinutes);
      setDurationSeconds(session.durationSeconds);
      setOrderMode(session.orderMode);
      setParticipants(session.participants);
      setCurrentIndex(session.currentIndex);
      setCurrentSpeakerLabel(session.currentSpeakerLabel);
      setHasStartedSpeaking(session.hasStartedSpeaking);
      setIsPaused(session.isPaused);
      setSecondsRemaining(session.secondsRemaining);
      setSharedCount(session.sharedCount);
      setSkippedCount(session.skippedCount);
      setSummaryTitle(session.summaryTitle);
    },
    []
  );

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFieldError(null);
    setSetupError(null);
    try {
      const session = await useCases.getSession();
      syncSessionState(session);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível preparar o Termômetro de Pedidos.');
      }
    } finally {
      setLoading(false);
    }
  }, [useCases, syncSessionState]);

  useEffect(() => {
    void loadSession();
    // Issue #52 / RNF12: ao desmontar a tela por qualquer caminho (ex.: voltar do sistema), descarta a sessão em memória
    return () => {
      void useCases.endSession().catch(() => {});
    };
  }, [loadSession, useCases]);

  const handleTick = useCallback(async () => {
    try {
      const updated = await useCases.tickSecond();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  useEffect(() => {
    if (
      stage !== 'turn' ||
      !hasStartedSpeaking ||
      isPaused ||
      confirmingExit ||
      secondsRemaining <= 0
    ) {
      return undefined;
    }

    const timerId = setInterval(() => {
      void handleTick();
    }, 1000);

    return () => clearInterval(timerId);
  }, [
    stage,
    hasStartedSpeaking,
    isPaused,
    confirmingExit,
    secondsRemaining,
    handleTick,
  ]);

  const handleClearFieldErrors = useCallback(() => {
    setFieldError(null);
    setSetupError(null);
  }, []);

  const handleSelectParticipantMode = useCallback(
    async (mode: TermometroParticipantMode) => {
      try {
        setFieldError(null);
        setSetupError(null);
        const updated = await useCases.setParticipantMode(mode);
        syncSessionState(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setSetupError(err.message);
        }
      }
    },
    [useCases, syncSessionState]
  );

  const handleSelectDuration = useCallback(
    async (minutes: TermometroDurationMinutes) => {
      try {
        setSetupError(null);
        const updated = await useCases.setDurationMinutes(minutes);
        syncSessionState(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setSetupError(err.message);
        }
      }
    },
    [useCases, syncSessionState]
  );

  const handleSelectOrderMode = useCallback(
    async (order: TermometroOrderMode) => {
      try {
        setSetupError(null);
        const updated = await useCases.setOrderMode(order);
        syncSessionState(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setSetupError(err.message);
        }
      }
    },
    [useCases, syncSessionState]
  );

  const handleAddCustomParticipant = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        setFieldError(null);
        setSetupError(null);
        const updated = await useCases.addCustomParticipant(name);
        syncSessionState(updated);
        return true;
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setFieldError(err.message);
        } else {
          setFieldError('Não foi possível adicionar o participante.');
        }
        return false;
      }
    },
    [useCases, syncSessionState]
  );

  const handleRemoveCustomParticipant = useCallback(
    async (name: string) => {
      try {
        setFieldError(null);
        setSetupError(null);
        const updated = await useCases.removeCustomParticipant(name);
        syncSessionState(updated);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setSetupError(err.message);
        }
      }
    },
    [useCases, syncSessionState]
  );

  const handleStartMoment = useCallback(async () => {
    try {
      setFieldError(null);
      setSetupError(null);
      const updated = await useCases.startMoment();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      } else {
        setSetupError('Não foi possível iniciar o momento de pedidos.');
      }
    }
  }, [useCases, syncSessionState]);

  const handleStartSpeaking = useCallback(async () => {
    try {
      setSetupError(null);
      const updated = await useCases.startSpeaking();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleTogglePause = useCallback(async () => {
    try {
      setSetupError(null);
      const updated = await useCases.togglePause();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleNextSpeaker = useCallback(async () => {
    try {
      setSetupError(null);
      const updated = await useCases.nextSpeaker();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleSkipSpeaker = useCallback(async () => {
    try {
      setSetupError(null);
      const updated = await useCases.skipSpeaker();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleFinishFreeMode = useCallback(async () => {
    try {
      setSetupError(null);
      const updated = await useCases.finishFreeMode();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleOpenPrayerMoment = useCallback(async () => {
    try {
      setSetupError(null);
      setConfirmingEndWithoutPrayer(false);
      const updated = await useCases.openPrayerMoment();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleRequestEndFromSummary = useCallback(() => {
    setConfirmingEndWithoutPrayer(true);
  }, []);

  const handleCancelEndWithoutPrayer = useCallback(() => {
    setConfirmingEndWithoutPrayer(false);
  }, []);

  // Issue #54: descarta os nomes (closeEncounter) e exibe o fechamento acolhedor (stage = 'closed') antes de voltar ao Hub
  const handleEndEncounter = useCallback(async () => {
    setConfirmingExit(false);
    setConfirmingEndWithoutPrayer(false);
    try {
      const updated = await useCases.closeEncounter();
      syncSessionState(updated);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setSetupError(err.message);
      }
    }
  }, [useCases, syncSessionState]);

  const handleBackToHub = useCallback(async () => {
    setConfirmingExit(false);
    setConfirmingEndWithoutPrayer(false);
    await useCases.endSession();
    router.replace('/');
  }, [useCases, router]);

  const handleRequestExit = useCallback(() => {
    setConfirmingExit(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setConfirmingExit(false);
  }, []);

  const handleConfirmExit = useCallback(async () => {
    setConfirmingExit(false);
    setConfirmingEndWithoutPrayer(false);
    await useCases.endSession();
    router.replace('/');
  }, [useCases, router]);

  const state: TermometroState = {
    stage,
    participantMode,
    durationMinutes,
    durationSeconds,
    orderMode,
    participants,
    currentIndex,
    currentSpeakerLabel,
    hasStartedSpeaking,
    isPaused,
    secondsRemaining,
    sharedCount,
    skippedCount,
    summaryTitle,
    confirmingExit,
    confirmingEndWithoutPrayer,
    loading,
    error,
    fieldError,
    setupError,
  };

  const actions: TermometroActions = {
    handleSelectParticipantMode,
    handleSelectDuration,
    handleSelectOrderMode,
    handleAddCustomParticipant,
    handleRemoveCustomParticipant,
    handleClearFieldErrors,
    handleStartMoment,
    handleStartSpeaking,
    handleTick,
    handleTogglePause,
    handleNextSpeaker,
    handleSkipSpeaker,
    handleFinishFreeMode,
    handleOpenPrayerMoment,
    handleRequestEndFromSummary,
    handleCancelEndWithoutPrayer,
    handleEndEncounter,
    handleBackToHub,
    handleRequestExit,
    handleCancelExit,
    handleConfirmExit,
    handleRetry: loadSession,
  };

  return [state, actions];
}
