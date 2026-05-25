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
  'lineups.details.type',
  'coaches',
  'formations',
  'periods',
  'statistics.type',
].join(';');

export async function fetchMatchDetail(fixtureId: string | number): Promise<DetailedFixture> {
  const result = await smGet<DetailedFixture>(`/fixtures/${fixtureId}`, { include: INCLUDE });

  // Debug: log state + periods so we can verify live detection and minute extraction
  console.log(
    `[matchDetail] id=${result.id} state.state="${result.state?.state}" ` +
    `is_live=${result.state?.is_live} short_name="${result.state?.short_name}"`,
  );
  if (result.periods?.length) {
    console.log('[matchDetail] periods:', JSON.stringify(result.periods));
  }

  return result;
}
