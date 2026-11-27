import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type ScoreboardNavKey = 'games' | 'teams' | 'scoreboard';

export type ScoreboardState = {
  teams: Team[];
  leaderTeam: Team | null;
  totalPoints: number;
  loading: boolean;
  error: string | null;
  confirmingReset: boolean;
};

export type ScoreboardActions = {
  handleRequestReset: () => void;
  handleCancelReset: () => void;
  handleResetScoreboard: () => Promise<void>;
  handleChooseAnotherGame: () => void;
  handleSelectNav: (key: ScoreboardNavKey) => void;
  handleRetry: () => Promise<void>;
};

export function useScoreboardViewModel(
  useCase: IPgPlayUseCases = pgPlayUseCases
): [ScoreboardState, ScoreboardActions] {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const hasLoadedRef = useRef<boolean>(false);

  const loadScoreboard = useCallback(
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
          setError('Não foi possível carregar o placar do encontro.');
        }
      } finally {
        setLoading(false);
      }
    },
    [useCase]
  );

  useFocusEffect(
    useCallback(() => {
      void loadScoreboard(false);
    }, [loadScoreboard])
  );

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

  const handleChooseAnotherGame = useCallback(() => {
    router.replace('/');
  }, [router]);

  const handleSelectNav = useCallback(
    (key: ScoreboardNavKey) => {
      if (key === 'games') {
        router.replace('/');
        return;
      }
      if (key === 'teams') {
        router.replace('/teams');
      }
    },
    [router]
  );

  const handleRetry = useCallback(async () => {
    await loadScoreboard(true);
  }, [loadScoreboard]);

  // Só existe líder quando a 1ª equipe tem pontos e não está empatada com a 2ª.
  const firstTeam = teams.length > 0 ? teams[0] : null;
  const secondTeam = teams.length > 1 ? teams[1] : null;
  const leaderTeam: Team | null =
    firstTeam &&
    firstTeam.score > 0 &&
    (!secondTeam || firstTeam.score > secondTeam.score)
      ? firstTeam
      : null;
  const totalPoints = teams.reduce((sum, team) => sum + team.score, 0);

  const state: ScoreboardState = {
    teams,
    leaderTeam,
    totalPoints,
    loading,
    error,
    confirmingReset,
  };

  const actions: ScoreboardActions = {
    handleRequestReset,
    handleCancelReset,
    handleResetScoreboard,
    handleChooseAnotherGame,
    handleSelectNav,
    handleRetry,
  };

  return [state, actions];
}
