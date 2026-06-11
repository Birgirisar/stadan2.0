import type { RoundFull, Fixture } from './types';
import { smGet } from './sportmonks';

// ─── Internal response shapes ─────────────────────────────────────────────────

interface SeasonRoundsResponse {
  id: number;
  name: string;
  rounds?: RoundFull[];
}

interface RoundFixturesResponse extends RoundFull {
  fixtures?: Fixture[];
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Fetch all rounds for a season, sorted by round number ascending.
 * Uses GET /v3/football/seasons/{seasonId}?include=rounds
 *
 * NOTE: Sportmonks may paginate the `rounds` array for large seasons.
 * For Icelandic leagues (≤22 rounds), this is not observed in practice.
 * If rounds appear truncated, increase per_page or implement pagination.
 *
 * Split-phase leagues (e.g. Besta deild karla/kvenna): after the regular
 * season the league splits into a championship group and a relegation group,
 * each replaying round numbers "1", "2", … from the start. This function
 * detects that situation, merges the concurrent playoff rounds from both
 * groups into single display chips, and renumbers them sequentially after
 * the last regular-season round (e.g. 23, 24, … for a 22-round season).
 */
export async function fetchRoundsForSeason(seasonId: number): Promise<RoundFull[]> {
  const season = await smGet<SeasonRoundsResponse>(`/seasons/${seasonId}`, {
    include: 'rounds',
  });

  const rounds: RoundFull[] = Array.isArray(season?.rounds) ? season.rounds : [];

  // Sort chronologically (starting_at), fall back to id for same-date rounds
  const byDate = [...rounds].sort((a, b) => {
    const ad = a.starting_at ?? '';
    const bd = b.starting_at ?? '';
    if (ad !== bd) return ad.localeCompare(bd);
    return a.id - b.id;
  });

  // ── Split-league detection ────────────────────────────────────────────────
  // In a split-phase league the same round name integer (e.g. "1") appears
  // multiple times. Because we sorted chronologically, the FIRST occurrence
  // of each integer belongs to the regular season; later occurrences are
  // playoff-phase rounds from the championship / relegation groups.
  const seenNameInts = new Set<number>();
  const mainRounds: RoundFull[] = [];
  const repeatRounds: RoundFull[] = [];

  for (const r of byDate) {
    const n = parseInt(r.name ?? '', 10);
    if (isNaN(n)) {
      mainRounds.push(r);
      continue;
    }
    if (seenNameInts.has(n)) {
      repeatRounds.push(r);
    } else {
      mainRounds.push(r);
      seenNameInts.add(n);
    }
  }

  if (repeatRounds.length === 0) {
    // No split — return the simple chronological sort (same as name order)
    return byDate;
  }

  // ── Merge concurrent playoff rounds ──────────────────────────────────────
  // repeatRounds contains rounds from multiple concurrent stages (championship
  // + relegation). Group by name integer so same-matchday rounds are merged
  // into one chip; fetching that chip's fixtures will query both groups.
  const maxMainName = mainRounds.reduce((mx, r) => {
    const n = parseInt(r.name ?? '0', 10);
    return isNaN(n) ? mx : Math.max(mx, n);
  }, 0);

  const byPlayoffName = new Map<number, RoundFull[]>();
  for (const r of repeatRounds) {
    const n = parseInt(r.name ?? '', 10);
    if (isNaN(n)) continue;
    if (!byPlayoffName.has(n)) byPlayoffName.set(n, []);
    byPlayoffName.get(n)!.push(r);
  }

  const playoffNamesSorted = [...byPlayoffName.keys()].sort((a, b) => a - b);

  const mergedPlayoff: RoundFull[] = playoffNamesSorted.map((playoffN, pos) => {
    const concurrent = byPlayoffName.get(playoffN)!;
    const mergedIds = concurrent.map((r) => r.id);

    // starting_at = earliest across groups; ending_at = latest across groups
    const starts = concurrent.map((r) => r.starting_at).filter((x): x is string => !!x);
    const ends = concurrent.map((r) => r.ending_at).filter((x): x is string => !!x);

    return {
      ...concurrent[0],
      name: String(maxMainName + pos + 1),
      finished: concurrent.every((r) => r.finished),
      starting_at: starts.sort()[0] ?? null,
      ending_at: ends.sort().reverse()[0] ?? null,
      mergedIds: mergedIds.length > 1 ? mergedIds : undefined,
    };
  });

  return [...mainRounds, ...mergedPlayoff];
}

/**
 * Fetch all fixtures for a specific round, sorted by kickoff time ascending.
 * Uses GET /v3/football/rounds/{roundId}?include=fixtures.participants;fixtures.scores;fixtures.state;fixtures.league
 */
export async function fetchFixturesForRound(roundId: number): Promise<Fixture[]> {
  const round = await smGet<RoundFixturesResponse>(`/rounds/${roundId}`, {
    include: 'fixtures.participants;fixtures.scores;fixtures.state;fixtures.league;fixtures.events',
  });

  const fixtures: Fixture[] = Array.isArray(round?.fixtures) ? round.fixtures : [];

  // Sort by ISO kickoff string — lexicographic order works for "YYYY-MM-DD HH:MM:SS"
  return [...fixtures].sort((a, b) =>
    (a.starting_at ?? '').localeCompare(b.starting_at ?? '')
  );
}
