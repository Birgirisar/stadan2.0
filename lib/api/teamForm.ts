import type { Fixture } from './types';
import { smGet } from './sportmonks';

interface ScheduleRound {
  finished: boolean;
  fixtures: Fixture[];
}

interface ScheduleStage {
  rounds: ScheduleRound[];
}

export async function fetchTeamForm(teamId: number, seasonId: number): Promise<Fixture[]> {
  let stages: ScheduleStage[];
  try {
    stages = await smGet<ScheduleStage[]>(
      `/schedules/seasons/${seasonId}/teams/${teamId}`,
    );
  } catch (e) {
    console.error('[teamForm] API error:', e);
    return [];
  }

  const allFixtures: Fixture[] = [];
  for (const stage of stages ?? []) {
    for (const round of stage.rounds ?? []) {
      if (!round.finished) continue;
      for (const fixture of round.fixtures ?? []) {
        allFixtures.push(fixture);
      }
    }
  }

  allFixtures.sort((a, b) => (b.starting_at_timestamp ?? 0) - (a.starting_at_timestamp ?? 0));
  return allFixtures.slice(0, 5);
}
