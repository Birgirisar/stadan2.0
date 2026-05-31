import type { Fixture } from './types';
import { smGet } from './sportmonks';

const INCLUDE = ['participants', 'scores', 'state', 'league', 'season'].join(';');

export async function fetchHeadToHead(teamId1: number, teamId2: number): Promise<Fixture[]> {
  return smGet<Fixture[]>(`/fixtures/head-to-head/${teamId1}/${teamId2}`, { include: INCLUDE });
}
