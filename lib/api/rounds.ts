import type { RoundFull, Fixture } from './types';
import { smGet } from './sportmonks';
import { getMatchState } from '../utils/state';

// ─── Internal response shapes ─────────────────────────────────────────────────

/** Raw round object as returned by /seasons/{id}?include=rounds — carries stage_id,
 * which the app's own RoundFull type doesn't need to expose. */
interface RawRound extends RoundFull {
  stage_id?: number;
}

interface RawStage {
  id: number;
  name: string;
  sort_order?: number;
}

interface SeasonRoundsResponse {
  id: number;
  name: string;
  rounds?: RawRound[];
  stages?: RawStage[];
}

interface RoundFixturesResponse extends RoundFull {
  fixtures?: Fixture[];
}

interface StageFixturesResponse {
  id: number;
  name: string;
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
 *
 * Round-less playoff stages (e.g. Lengjudeild karla's promotion play-off):
 * some leagues append extra stages to a season (semi-finals, final) without
 * ever creating Round objects for them — /seasons/{id}?include=rounds simply
 * omits those fixtures. This function detects any stage not represented in
 * the rounds list and synthesizes display rounds for it directly from that
 * stage's fixtures (see fetchExtraStageRounds), grouped by matchday and
 * numbered after the rounds already computed above.
 */
export async function fetchRoundsForSeason(seasonId: number): Promise<RoundFull[]> {
  const season = await smGet<SeasonRoundsResponse>(`/seasons/${seasonId}`, {
    include: 'rounds;stages',
  });

  const rawRounds: RawRound[] = Array.isArray(season?.rounds) ? season.rounds : [];
  const rounds: RoundFull[] = rawRounds;

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

  // Chip display order follows round NUMBER, not actual kickoff date — a game
  // pushed earlier or postponed later can shift a round's whole date window
  // (see byDate above) without that round logically moving in the sequence.
  // mainRounds' round-number ints are unique by construction (split-league
  // detection above), so this is a plain numeric sort; non-numeric names
  // (rare) sort after, preserving their original relative order.
  const mainRoundsOrdered = [...mainRounds].sort((a, b) => {
    const an = parseInt(a.name ?? '', 10);
    const bn = parseInt(b.name ?? '', 10);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    if (isNaN(an) !== isNaN(bn)) return isNaN(an) ? 1 : -1;
    return 0;
  });

  const baseRounds: RoundFull[] = [...mainRoundsOrdered, ...mergedPlayoff];

  // ── Round-less extra stages ────────────────────────────────────────────────
  const coveredStageIds = new Set(
    rawRounds.map((r) => r.stage_id).filter((x): x is number => x != null)
  );
  const extraStages = (season.stages ?? [])
    .filter((s) => !coveredStageIds.has(s.id))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (extraStages.length === 0) return baseRounds;

  const maxBaseName = baseRounds.reduce((mx, r) => {
    const n = parseInt(r.name ?? '0', 10);
    return isNaN(n) ? mx : Math.max(mx, n);
  }, 0);

  const stageRounds = await fetchExtraStageRounds(extraStages, maxBaseName);
  return [...baseRounds, ...stageRounds];
}

/**
 * Build synthetic display rounds for stages that have no native Round objects
 * (see fetchRoundsForSeason). Each stage's fixtures are fetched directly and
 * grouped by matchday (calendar date), since that's the closest equivalent to
 * a "round" for these stages — e.g. a two-legged semi-final becomes two chips.
 * Chip ids are synthetic (derived from the stage id), not real Sportmonks
 * round ids — fetchFixturesByIds must be used to refresh their fixtures.
 */
async function fetchExtraStageRounds(stages: RawStage[], startName: number): Promise<RoundFull[]> {
  const out: RoundFull[] = [];
  let nextName = startName;

  for (const stage of stages) {
    const data = await smGet<StageFixturesResponse>(`/stages/${stage.id}`, {
      include: 'fixtures.participants;fixtures.scores;fixtures.state;fixtures.league;fixtures.events',
    });
    const fixtures: Fixture[] = Array.isArray(data?.fixtures) ? data.fixtures : [];
    if (fixtures.length === 0) continue;

    const byDay = new Map<string, Fixture[]>();
    for (const f of fixtures) {
      const day = (f.starting_at ?? '').slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(f);
    }

    [...byDay.keys()].sort().forEach((day, dayIndex) => {
      const dayFixtures = [...byDay.get(day)!].sort((a, b) =>
        (a.starting_at ?? '').localeCompare(b.starting_at ?? '')
      );
      nextName += 1;
      out.push({
        id: stage.id * 100 + dayIndex,
        name: String(nextName),
        finished: dayFixtures.every((f) => getMatchState(f.state).type === 'finished'),
        starting_at: dayFixtures[0].starting_at,
        ending_at: dayFixtures[dayFixtures.length - 1].starting_at,
        fixtures: dayFixtures,
      });
    });
  }

  return out;
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

/**
 * Fetch specific fixtures by id, sorted by kickoff time ascending.
 * Uses GET /v3/football/fixtures/multi/{ids} — the refresh path for synthetic
 * stage-based rounds (see fetchExtraStageRounds), which have no real round id
 * to call fetchFixturesForRound with.
 */
export async function fetchFixturesByIds(ids: number[]): Promise<Fixture[]> {
  if (ids.length === 0) return [];

  const fixtures = await smGet<Fixture[]>(`/fixtures/multi/${ids.join(',')}`, {
    include: 'participants;scores;state;league;events',
  });

  return [...(Array.isArray(fixtures) ? fixtures : [])].sort((a, b) =>
    (a.starting_at ?? '').localeCompare(b.starting_at ?? '')
  );
}

interface FixtureWithStageResponse {
  id: number;
  stage?: { id: number; name: string; fixtures?: Fixture[] };
}

/**
 * Given a fixture that belongs to a round-less play-off stage (identifiable
 * by having no `round` — see fetchExtraStageRounds), fetch every fixture in
 * its stage directly, e.g. to compute an aggregate scoreline for its tie
 * outside the League Detail screen (which already has this via `rounds`).
 * Uses GET /v3/football/fixtures/{id}?include=stage.fixtures...
 */
export async function fetchStageSiblingFixtures(fixtureId: number): Promise<Fixture[]> {
  const data = await smGet<FixtureWithStageResponse>(`/fixtures/${fixtureId}`, {
    include: 'stage.fixtures.participants;stage.fixtures.scores;stage.fixtures.state',
  });
  return data?.stage?.fixtures ?? [];
}
