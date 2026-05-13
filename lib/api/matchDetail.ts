import type { DetailedFixture } from './types';
import { smGet } from './sportmonks';

const INCLUDE = [
  'participants',
  'scores',
  'state',
  'league',
  'round',
  'venue',
  'events.player',
  'events.relatedPlayer',
  'events.type',
  'lineups.player',
  'periods',
  'statistics.type',
].join(';');

export async function fetchMatchDetail(fixtureId: string | number): Promise<DetailedFixture> {
  return smGet<DetailedFixture>(`/fixtures/${fixtureId}`, { include: INCLUDE });
}
