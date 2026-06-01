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
 */
export async function fetchRoundsForSeason(seasonId: number): Promise<RoundFull[]> {
  const season = await smGet<SeasonRoundsResponse>(`/seasons/${seasonId}`, {
    include: 'rounds',
  });

  const rounds: RoundFull[] = Array.isArray(season?.rounds) ? season.rounds : [];

  // Sort by parsed name integer (usually "1"…"22"), fall back to id order
  return [...rounds].sort((a, b) => {
    const ai = parseInt(a.name ?? '', 10);
    const bi = parseInt(b.name ?? '', 10);
    if (!isNaN(ai) && !isNaN(bi)) return ai - bi;
    return a.id - b.id;
  });
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
