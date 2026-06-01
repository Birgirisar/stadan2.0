import { useQuery } from '@tanstack/react-query';
import { toDateString } from '../utils/dates';
import { getMatchState } from '../utils/state';
import type { Fixture } from './types';
import { smGet } from './sportmonks';

const LEAGUE_FILTER = '345,348,351,1710,1711';
const INCLUDE = 'participants;scores;state;league;round;periods;events';

async function fetchFixturesByDate(dateStr: string): Promise<Fixture[]> {
  const result = await smGet<Fixture[]>(`/fixtures/date/${dateStr}`, {
    include: INCLUDE,
    filters: `fixtureLeagues:${LEAGUE_FILTER}`,
    timezone: 'Atlantic/Reykjavik',
  });
  const fixtures = Array.isArray(result) ? result : [];

  // Debug: log state fields so we can verify live detection works correctly
  for (const f of fixtures) {
    if (f.state) {
      console.log(
        `[fixtures] id=${f.id} state.state="${f.state.state}" is_live=${f.state.is_live} ` +
        `is_pending=${f.state.is_pending} short_name="${f.state.short_name}" ` +
        `periods=${f.periods?.length ?? 0}`
      );
    }
  }

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
      if (!data?.length) return false;
      const types = data.map((f) => getMatchState(f.state).type);
      // Fast poll while any match is live or at halftime
      if (types.some((t) => t === 'live' || t === 'halftime')) return 60_000;
      // Slow poll while any match is still pending — catches kick-off
      if (types.some((t) => t === 'pending')) return 120_000;
      // All finished or cancelled — stop polling
      return false;
    },
  });
}
