import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { pgPlayUseCases } from '@/di/container';
import type { GameModalityFilter, Minigame } from '@/model/entities/minigame';
import type { Team } from '@/model/entities/team';
import { DomainError } from '@/model/errors';
import type { IPgPlayUseCases } from '@/usecase/iPgPlayUseCases';

export type HubState = {
  games: Minigame[];
  allGamesCount: number;
  searchQuery: string;
  selectedModality: GameModalityFilter;
  leaderTeam: Team | null;
  totalTeams: number;
  loading: boolean;
  error: string | null;
};

export type HubActions = {
  setSearchQuery: (query: string) => Promise<void>;
  setSelectedModality: (modality: GameModalityFilter) => Promise<void>;
  handleClearFilters: () => Promise<void>;
  handleSelectGame: (game: Minigame) => void;
  handleOpenTeams: () => void;
  handleOpenScoreboard: () => void;
  handleRetry: () => Promise<void>;
};

export function useHubViewModel(
  useCase: IPgPlayUseCases = pgPlayUseCases
): [HubState, HubActions] {
  const router = useRouter();

  const [games, setGames] = useState<Minigame[]>([]);
  const [allGamesCount, setAllGamesCount] = useState<number>(0);
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [selectedModality, setSelectedModalityState] =
    useState<GameModalityFilter>('Todos');
  const [leaderTeam, setLeaderTeam] = useState<Team | null>(null);
  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const filterRequestRef = useRef<number>(0);

  const loadHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalog, scoreboard] = await Promise.all([
        useCase.listMinigames('', 'Todos'),
        useCase.getScoreboard(),
      ]);
      setGames(catalog);
      setAllGamesCount(catalog.length);
      setTotalTeams(scoreboard.length);
      setLeaderTeam(scoreboard.length > 0 ? scoreboard[0] : null);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        setError(err.message);
      } else {
        setError('Não foi possível carregar o catálogo de jogos do PG.');
      }
    } finally {
      setLoading(false);
    }
  }, [useCase]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const applyFilters = useCallback(
    async (query: string, modality: GameModalityFilter) => {
      const requestId = ++filterRequestRef.current;
      try {
        const filtered = await useCase.listMinigames(query, modality);
        if (requestId === filterRequestRef.current) {
          setGames(filtered);
          setError(null);
        }
      } catch (err: unknown) {
        if (requestId === filterRequestRef.current) {
          if (err instanceof DomainError) {
            setError(err.message);
          } else {
            setError('Não foi possível filtrar os minigames.');
          }
        }
      }
    },
    [useCase]
  );

  const setSearchQuery = useCallback(
    async (query: string) => {
      setSearchQueryState(query);
      await applyFilters(query, selectedModality);
    },
    [applyFilters, selectedModality]
  );

  const setSelectedModality = useCallback(
    async (modality: GameModalityFilter) => {
      setSelectedModalityState(modality);
      await applyFilters(searchQuery, modality);
    },
    [applyFilters, searchQuery]
  );

  const handleClearFilters = useCallback(async () => {
    setSearchQueryState('');
    setSelectedModalityState('Todos');
    await applyFilters('', 'Todos');
  }, [applyFilters]);

  const handleSelectGame = useCallback(
    (game: Minigame) => {
      if (!game.available) {
        return;
      }
      router.push(game.route);
    },
    [router]
  );

  const handleOpenTeams = useCallback(() => {
    router.push('/teams');
  }, [router]);

  const handleOpenScoreboard = useCallback(() => {
    router.push('/scoreboard');
  }, [router]);

  const state: HubState = {
    games,
    allGamesCount,
    searchQuery,
    selectedModality,
    leaderTeam,
    totalTeams,
    loading,
    error,
  };

  const actions: HubActions = {
    setSearchQuery,
    setSelectedModality,
    handleClearFilters,
    handleSelectGame,
    handleOpenTeams,
    handleOpenScoreboard,
    handleRetry: loadHub,
  };

  return [state, actions];
}
