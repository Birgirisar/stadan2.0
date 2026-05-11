import { useQuery } from '@tanstack/react-query';
import { toDateString } from '../utils/dates';
import type { Fixture } from './types';
import { smGet } from './sportmonks';

const LEAGUE_FILTER = '345,348,351,1710,1711';
const INCLUDE = 'participants;scores;state;league;round';

async function fetchFixturesByDate(dateStr: string): Promise<Fixture[]> {
  const result = await smGet<Fixture[]>(`/fixtures/date/${dateStr}`, {
    include: INCLUDE,
    filters: `fixtureLeagues:${LEAGUE_FILTER}`,
    timezone: 'Atlantic/Reykjavik',
  });
  const fixtures = Array.isArray(result) ? result : [];

  return fixtures;
}

export function useFixturesByDate(date: Date) {
  const dateStr = toDateString(date);

  return useQuery({
    queryKey: ['fixtures', dateStr],
    queryFn: () => fetchFixturesByDate(dateStr),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const data = query.state.data as Fixture[] | undefined;
      return data?.some((f) => f.state?.is_live) ? 30_000 : false;
    },
  });
}
