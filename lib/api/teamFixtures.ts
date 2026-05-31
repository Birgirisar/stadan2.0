import { smGet } from './sportmonks';
import type { Fixture, FixtureState } from './types';
import type { ScheduleStage } from './teamDetail';

const FINISHED_IDS = new Set([5, 6, 7, 8, 26, 52]);
const LIVE_IDS = new Set([2, 3, 13, 25]);

function syntheticState(stateId: number): FixtureState {
  if (FINISHED_IDS.has(stateId)) {
    return { id: stateId, name: 'Leikur lokinn', state: 'FT', is_final_state: true };
  }
  if (LIVE_IDS.has(stateId)) {
    return { id: stateId, name: 'Í gangi', state: 'INPLAY_1ST_HALF', is_live: true };
  }
  return { id: stateId, name: 'Óstaðfest', state: 'NS', is_pending: true };
}

/**
 * Fetches all fixtures for a team in a specific season, sorted chronologically.
 *
 * Uses the schedule endpoint (no 100-day limit), filters by seasonId,
 * and synthesises a FixtureState from state_id so MatchRow renders correctly.
 */
export async function fetchTeamSeasonFixtures(
  teamId: number,
  seasonId: number,
): Promise<Fixture[]> {
  const stages = await smGet<ScheduleStage[]>(`/schedules/teams/${teamId}`);

  const fixtures: Fixture[] = [];
  for (const stage of Array.isArray(stages) ? stages : []) {
    if (stage.season_id !== seasonId) continue;
    for (const round of stage.rounds) {
      for (const f of round.fixtures ?? []) {
        fixtures.push({ ...f, state: syntheticState(f.state_id) });
      }
    }
  }

  fixtures.sort((a, b) => (a.starting_at_timestamp ?? 0) - (b.starting_at_timestamp ?? 0));
  return fixtures;
}
