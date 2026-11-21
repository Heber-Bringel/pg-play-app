import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

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

  const loadScoreboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rankedTeams = await useCase.getScoreboard();
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
  }, [useCase]);

  useEffect(() => {
    void loadScoreboard();
  }, [loadScoreboard]);

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
    router.push('/');
  }, [router]);

  const handleRetry = useCallback(async () => {
    await loadScoreboard();
  }, [loadScoreboard]);

  // Só existe líder quando a 1ª equipe tem pontos e não está empatada com a 2ª.
  const firstTeam = teams.length > 0 ? teams[0] : null;
  const secondTeam = teams.length > 1 ? teams[1] : null;
  const leaderTeam: Team | null =
    firstTeam && firstTeam.score > 0 && (!secondTeam || firstTeam.score > secondTeam.score)
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
    handleRetry,
  };

  return [state, actions];
}
