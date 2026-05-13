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
      return data?.state?.is_live ? 30_000 : false;
    },
  });
}
