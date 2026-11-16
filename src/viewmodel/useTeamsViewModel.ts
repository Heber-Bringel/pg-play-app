import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type TeamsState = {
  teams: Team[];
  newTeamName: string;
  errorMessage: string | null;
  loading: boolean;
  canStartRound: boolean;
};

export type TeamsActions = {
  setNewTeamName: (name: string) => void;
  handleAddTeam: () => Promise<void>;
  handleRemoveTeam: (id: string) => Promise<void>;
  handleStartRound: () => void;
  handleBack: () => void;
  clearError: () => void;
  handleRetry: () => Promise<void>;
};

export function useTeamsViewModel(
  useCase: IPgPlayUseCases = pgPlayUseCases
): [TeamsState, TeamsActions] {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamNameState] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const list = await useCase.listTeams();
      setTeams(list);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Não foi possível carregar as equipes.');
      }
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const setNewTeamName = useCallback((name: string) => {
    setNewTeamNameState(name);
    setErrorMessage(null);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const handleAddTeam = useCallback(async () => {
    setErrorMessage(null);
    try {
      const created = await useCase.addTeam(newTeamName);
      setTeams((prev) => [...prev, created]);
      setNewTeamNameState('');
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Erro ao adicionar equipe.');
      }
    }
  }, [useCase, newTeamName]);

  const handleRemoveTeam = useCallback(
    async (id: string) => {
      setErrorMessage(null);
      try {
        const remaining = await useCase.removeTeam(id);
        setTeams(remaining);
      } catch (err: unknown) {
        if (err instanceof DomainError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Erro ao remover equipe.');
        }
      }
    },
    [useCase]
  );

  const handleStartRound = useCallback(() => {
    if (teams.length < 2) {
      setErrorMessage('Adicione pelo menos 2 equipes para começar a rodada.');
      return;
    }
    router.push('/mimica');
  }, [router, teams.length]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const state: TeamsState = {
    teams,
    newTeamName,
    errorMessage,
    loading,
    canStartRound: teams.length >= 2,
  };

  const actions: TeamsActions = {
    setNewTeamName,
    handleAddTeam,
    handleRemoveTeam,
    handleStartRound,
    handleBack,
    clearError,
    handleRetry: loadTeams,
  };

  return [state, actions];
}
