import { useQuery } from '@tanstack/react-query';
import { fetchMatchDetail } from '../api/matchDetail';
import { getMatchState } from '../utils/state';

export function useMatchDetail(fixtureId: string | number | undefined) {
  return useQuery({
    queryKey: ['match-detail', String(fixtureId)],
    queryFn: () => fetchMatchDetail(fixtureId!),
    enabled: fixtureId != null,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const type = getMatchState(data.state).type;
      if (type === 'live' || type === 'halftime') return 60_000;
      if (type === 'finished' || type === 'cancelled') return false;
      // Pending — slow poll until kick-off
      return 120_000;
    },
  });
}
