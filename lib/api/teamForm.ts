import type { Fixture } from './types';
import { smGet } from './sportmonks';
import { toDateString } from '../utils/dates';

export async function fetchTeamForm(teamId: number): Promise<Fixture[]> {
  const to = toDateString(new Date());
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);
  const from = toDateString(fromDate);

  const result = await smGet<Fixture[]>(`/fixtures/between/${from}/${to}`, {
    include: 'participants;scores;state',
    filters: `fixtureTeams:${teamId};fixtureStates:5`,
    per_page: '10',
    order: 'desc',
  });

  const fixtures = Array.isArray(result) ? result : [];
  return fixtures.slice(0, 5);
}
