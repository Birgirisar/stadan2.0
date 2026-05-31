import { useQuery } from '@tanstack/react-query';
import { fetchHeadToHead } from '../api/headToHead';
import { calculateH2HSummary } from '../utils/h2h';

export function useHeadToHead(
  homeTeamId: number | undefined,
  awayTeamId: number | undefined,
  currentFixtureId: number,
) {
  const id1 = homeTeamId != null && awayTeamId != null
    ? Math.min(homeTeamId, awayTeamId)
    : null;
  const id2 = homeTeamId != null && awayTeamId != null
    ? Math.max(homeTeamId, awayTeamId)
    : null;

  return useQuery({
    queryKey: ['h2h', [id1, id2], currentFixtureId],
    queryFn: async () => {
      const fixtures = await fetchHeadToHead(homeTeamId!, awayTeamId!);
      const meetings = fixtures
        .filter((f) => f.id !== currentFixtureId)
        .sort((a, b) => b.starting_at.localeCompare(a.starting_at));
      const summary = calculateH2HSummary(meetings, homeTeamId!, awayTeamId!);
      return { meetings, summary };
    },
    enabled: homeTeamId != null && awayTeamId != null,
    staleTime: 5 * 60_000,
  });
}
