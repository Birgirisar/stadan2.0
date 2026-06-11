import { useQuery } from '@tanstack/react-query';
import { fetchLeague, fetchStandingsFull, fetchStandingsGrouped } from '../api/leagues';

export function useLeagueMeta(leagueId: number) {
  return useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => fetchLeague(leagueId),
    staleTime: 60_000,
  });
}

export function useLeagueStandings(seasonId: number | null) {
  return useQuery({
    queryKey: ['standings-full', seasonId ?? 0],
    queryFn: () => (seasonId ? fetchStandingsFull(seasonId) : Promise.resolve([])),
    enabled: !!seasonId,
    staleTime: 60_000,
  });
}

export function useLeagueStandingsGrouped(seasonId: number | null) {
  return useQuery({
    queryKey: ['standings-grouped', seasonId ?? 0],
    queryFn: () => (seasonId ? fetchStandingsGrouped(seasonId) : Promise.resolve([])),
    enabled: !!seasonId,
    staleTime: 60_000,
  });
}
