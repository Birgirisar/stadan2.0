import { useQuery } from '@tanstack/react-query';
import { fetchCommentary } from '../api/commentary';
import { deduplicateCommentary, getSortMinute } from '../utils/commentary';

export function useCommentary(
  fixtureId: string | number | undefined,
  isLive: boolean,
) {
  return useQuery({
    queryKey: ['commentary', String(fixtureId)],
    queryFn: () => fetchCommentary(fixtureId!),
    enabled: fixtureId != null,
    staleTime: 30_000,
    // Live match: poll every 20s. Finished/pending: no auto-refetch.
    refetchInterval: isLive ? 20_000 : false,
    select: (data) => {
      const deduped = deduplicateCommentary(data);
      // Sort newest-first by effective minute, not by `order`.
      // Sportmonks assigns `order` at insertion time, so late-corrected entries
      // (e.g. a min=49 entry inserted after min=54 events) would otherwise float
      // to the top. Minute-based sorting keeps the feed chronologically correct.
      // Within the same effective minute, higher `order` (more recently inserted)
      // goes first.
      return deduped.sort((a, b) => {
        const diff = getSortMinute(b) - getSortMinute(a);
        if (diff !== 0) return diff;
        return b.order - a.order;
      });
    },
  });
}
