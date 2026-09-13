import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { Fixture } from '../api/types';
import { fetchStageSiblingFixtures } from '../api/rounds';
import { computeAggregateScores } from '../utils/aggregate';

/**
 * Aggregate scorelines for two-legged play-off ties appearing anywhere a
 * fixture list is rendered (e.g. the Home tab's "today" view, team pages).
 *
 * A fixture with no `round` is a round-less play-off-stage fixture (see
 * fetchRoundsForSeason/fetchExtraStageRounds — Sportmonks never creates Round
 * objects for these). For each such fixture we fetch its parent stage's
 * sibling fixtures directly (one request per candidate — rare, at most a
 * couple per day for one league), then compute the aggregate the same way
 * the League Detail screen does.
 */
export function useAggregateScores(fixtures: Fixture[]): Map<number, string> {
  const candidateIds = useMemo(
    () => [...new Set(fixtures.filter((f) => !f.round).map((f) => f.id))],
    [fixtures]
  );

  const stageQueries = useQueries({
    queries: candidateIds.map((id) => ({
      queryKey: ['stage-siblings', id],
      queryFn: () => fetchStageSiblingFixtures(id),
      staleTime: 30_000,
      refetchInterval: (query: { state: { data?: Fixture[] } }) =>
        query.state.data?.some((f) => f.state?.is_live) ? 30_000 : false,
    })),
  });

  const allSiblings = stageQueries.flatMap((q) => q.data ?? []);

  return useMemo(() => computeAggregateScores(allSiblings), [allSiblings]);
}
