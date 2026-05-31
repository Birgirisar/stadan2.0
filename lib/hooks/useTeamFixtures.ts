import { useQuery } from '@tanstack/react-query';
import { fetchTeamSeasonFixtures } from '../api/teamFixtures';
import type { Fixture } from '../api/types';

export interface UseTeamFixturesResult {
  fixtures: Fixture[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
}

export function useTeamFixtures(
  teamId: number,
  seasonId: number | undefined,
): UseTeamFixturesResult {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['team-fixtures', teamId, seasonId],
    queryFn: () => fetchTeamSeasonFixtures(teamId, seasonId!),
    enabled: !!seasonId,
    staleTime: 60_000,
    refetchInterval: (query) => {
      const fixtures = query.state.data as Fixture[] | undefined;
      return fixtures?.some((f) => f.state?.is_live) ? 30_000 : false;
    },
  });

  return {
    fixtures: data ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
    isRefetching,
  };
}
