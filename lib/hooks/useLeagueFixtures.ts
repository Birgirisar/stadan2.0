import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRoundsForSeason, fetchFixturesForRound } from '../api/rounds';
import { pickDefaultRound } from '../utils/rounds';
import type { RoundFull, Fixture } from '../api/types';

export interface UseLeagueFixturesResult {
  /** All rounds for the season, sorted ascending. Empty while loading. */
  rounds: RoundFull[];
  /** The currently displayed round ID — user selection or auto-derived default. */
  selectedRoundId: number | undefined;
  /** Switch to a different round. */
  setSelectedRoundId: (id: number) => void;
  /** Fixtures for the selected round, sorted by kickoff ascending. */
  fixtures: Fixture[];

  roundsLoading: boolean;
  fixturesLoading: boolean;
  roundsError: Error | null;
  fixturesError: Error | null;

  refetchRounds: () => void;
  refetchFixtures: () => void;
}

/**
 * Two-step data hook for the League Detail Leikir tab.
 *
 * Step 1 — fetch all rounds for the season (staleTime 5 min).
 * Step 2 — fetch fixtures for the selected round (staleTime 30 s, live-poll when live).
 *
 * The selected round is user-controlled; if no selection has been made it
 * falls back to `pickDefaultRound()` once step 1 completes.
 *
 * Pass `seasonId = null` to disable both queries (e.g. while the season is
 * not yet known).
 */
export function useLeagueFixtures(seasonId: number | null): UseLeagueFixturesResult {
  // Explicit user selection — undefined means "use the auto-derived default"
  const [manualRoundId, setManualRoundId] = useState<number | undefined>(undefined);

  // ── Step 1: All rounds ────────────────────────────────────────────────────
  const {
    data: rounds = [],
    isLoading: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: ['rounds', seasonId ?? 0],
    queryFn: () => fetchRoundsForSeason(seasonId!),
    enabled: !!seasonId,
    staleTime: 5 * 60_000,
  });

  // Derive the auto-default whenever rounds change
  const defaultRoundId = useMemo(
    () => pickDefaultRound(rounds) ?? undefined,
    [rounds]
  );

  // Resolved active round — prefer explicit selection, fall back to default
  const selectedRoundId = manualRoundId ?? defaultRoundId;

  // ── Step 2: Fixtures for the active round ─────────────────────────────────
  const {
    data: fixtures = [],
    isLoading: fixturesLoading,
    error: fixturesError,
    refetch: refetchFixtures,
  } = useQuery({
    queryKey: ['round-fixtures', selectedRoundId ?? 0],
    queryFn: () => fetchFixturesForRound(selectedRoundId!),
    enabled: !!selectedRoundId,
    staleTime: 30_000,
    // Live-poll when any fixture in this round is currently playing
    refetchInterval: (query) => {
      const data = query.state.data as Fixture[] | undefined;
      return data?.some((f) => f.state?.is_live) ? 30_000 : false;
    },
  });

  return {
    rounds,
    selectedRoundId,
    setSelectedRoundId: setManualRoundId,
    fixtures,
    roundsLoading,
    fixturesLoading,
    roundsError: roundsError as Error | null,
    fixturesError: fixturesError as Error | null,
    refetchRounds,
    refetchFixtures,
  };
}
