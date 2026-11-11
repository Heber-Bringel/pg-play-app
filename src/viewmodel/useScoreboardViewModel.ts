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
};

export type ScoreboardActions = {
  handleAwardBonus: (teamId: string, bonusPoints?: number) => Promise<void>;
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

  const handleAwardBonus = useCallback(
    async (teamId: string, bonusPoints?: number) => {
      try {
        setError(null);
        const updatedTeams = await useCase.awardBonusPoints(teamId, bonusPoints);
        setTeams(updatedTeams);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setError(err.message);
        } else {
          setError('Não foi possível conceder o bônus para a equipe.');
        }
      }
    },
    [useCase]
  );

  const handleResetScoreboard = useCallback(async () => {
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

  const leaderTeam: Team | null = teams.length > 0 ? teams[0] : null;
  const totalPoints = teams.reduce((sum, team) => sum + team.score, 0);

  const state: ScoreboardState = {
    teams,
    leaderTeam,
    totalPoints,
    loading,
    error,
  };

  const actions: ScoreboardActions = {
    handleAwardBonus,
    handleResetScoreboard,
    handleChooseAnotherGame,
    handleRetry,
  };

  return [state, actions];
}
