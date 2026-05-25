import { useQuery } from '@tanstack/react-query';
import { fetchMatchDetail } from '../api/matchDetail';

export function useMatchDetail(fixtureId: string | number | undefined) {
  return useQuery({
    queryKey: ['match-detail', String(fixtureId)],
    queryFn: () => fetchMatchDetail(fixtureId!),
    enabled: fixtureId != null,
    staleTime: 30_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.state?.is_live) return 30_000;
      if (data.state?.is_final_state || data.state?.is_cancelled) return false;
      // Pending — keep polling until kick-off happens
      return 60_000;
    },
  });
}
