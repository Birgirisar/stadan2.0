import { useQuery } from '@tanstack/react-query';
import { fetchStandings } from '../api/standings';

export function useStandings(seasonId: number | undefined) {
  return useQuery({
    queryKey: ['standings', seasonId],
    queryFn: () => fetchStandings(seasonId!),
    enabled: seasonId != null,
    staleTime: 5 * 60 * 1000,
  });
}
