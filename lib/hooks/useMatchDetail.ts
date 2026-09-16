import { useQuery } from '@tanstack/react-query';
import { fetchMatchDetail } from '../api/matchDetail';
import { getMatchState } from '../utils/state';
import { isAwaitingPossibleExtraTime } from '../utils/extraTime';

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
      if (type === 'cancelled') return false;
      if (type === 'finished') {
        // A knockout leg just reached "FT" — keep polling briefly in case
        // it continues into extra time (see isAwaitingPossibleExtraTime).
        return isAwaitingPossibleExtraTime(data) ? 60_000 : false;
      }
      // Pending — slow poll until kick-off
      return 120_000;
    },
  });
}
