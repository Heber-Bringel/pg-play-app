import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

let encounterStartedInSession = false;

export function hasStartedEncounterInSession(): boolean {
  return encounterStartedInSession;
}

export function markEncounterStartedInSession(): void {
  encounterStartedInSession = true;
}

export function resetWelcomeSessionForTests(): void {
  encounterStartedInSession = false;
}

export type WelcomeState = {
  teams: Team[];
  podiumTeams: Team[];
  totalTeams: number;
  totalPoints: number;
  loading: boolean;
  error: string | null;
  confirmingReset: boolean;
  splashVisible: boolean;
};

export type WelcomeActions = {
  handleStartGames: () => void;
  handleOpenMultiplayer: () => void;
  handleOpenTeams: () => void;
  handleOpenScoreboard: () => void;
  handleRequestReset: () => void;
  handleCancelReset: () => void;
  handleResetScoreboard: () => Promise<void>;
  handleDismissSplash: () => void;
  handleRetry: () => Promise<void>;
};

export function useWelcomeViewModel(
  useCase: IPgPlayUseCases = pgPlayUseCases
): [WelcomeState, WelcomeActions] {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const [splashVisible, setSplashVisible] = useState<boolean>(
    () => !encounterStartedInSession
  );
  const hasLoadedRef = useRef<boolean>(false);

  const loadWelcome = useCallback(
    async (showLoading = false) => {
      if (showLoading || !hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const rankedTeams = await useCase.getScoreboard();
        hasLoadedRef.current = true;
        setTeams(rankedTeams);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível carregar o painel do encontro.');
        }
      } finally {
        setLoading(false);
      }
    },
    [useCase]
  );

  useFocusEffect(
    useCallback(() => {
      if (encounterStartedInSession) {
        setSplashVisible(false);
        routerRef.current.replace('/');
        return;
      }
      void loadWelcome(false);
    }, [loadWelcome])
  );

  const handleStartGames = useCallback(() => {
    markEncounterStartedInSession();
    router.replace('/');
  }, [router]);

  const handleOpenMultiplayer = useCallback(() => {
    markEncounterStartedInSession();
    router.replace('/?modality=Multi-Celular');
  }, [router]);

  const handleOpenTeams = useCallback(() => {
    markEncounterStartedInSession();
    router.replace('/teams');
  }, [router]);

  const handleOpenScoreboard = useCallback(() => {
    markEncounterStartedInSession();
    router.replace('/scoreboard');
  }, [router]);

  const handleRequestReset = useCallback(() => {
    setConfirmingReset(true);
  }, []);

  const handleCancelReset = useCallback(() => {
    setConfirmingReset(false);
  }, []);

  const handleResetScoreboard = useCallback(async () => {
    setConfirmingReset(false);
    try {
      setError(null);
      const resetTeams = await useCase.resetScoreboard();
      setTeams(resetTeams);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível zerar o placar do PG.');
      }
    }
  }, [useCase]);

  const handleDismissSplash = useCallback(() => {
    setSplashVisible(false);
  }, []);

  const handleRetry = useCallback(async () => {
    await loadWelcome(true);
  }, [loadWelcome]);

  const podiumTeams = teams.slice(0, 3);
  const totalTeams = teams.length;
  const totalPoints = teams.reduce((sum, team) => sum + team.score, 0);

  const state: WelcomeState = {
    teams,
    podiumTeams,
    totalTeams,
    totalPoints,
    loading,
    error,
    confirmingReset,
    splashVisible,
  };

  const actions: WelcomeActions = {
    handleStartGames,
    handleOpenMultiplayer,
    handleOpenTeams,
    handleOpenScoreboard,
    handleRequestReset,
    handleCancelReset,
    handleResetScoreboard,
    handleDismissSplash,
    handleRetry,
  };

  return [state, actions];
}
