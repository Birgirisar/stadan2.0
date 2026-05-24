import type { Standing } from './types';
import { smGet } from './sportmonks';
import { extractStandingRows } from './leagues';

export async function fetchStandings(seasonId: number): Promise<Standing[]> {
  const raw = await smGet<unknown[]>(`/standings/seasons/${seasonId}`, {
    include: 'participant;details',
  });

  if (!Array.isArray(raw)) return [];

  // Reuse the same robust flat-vs-stage parser that the league detail uses.
  // Cast is safe: Standing is a superset of the fields StandingRow uses.
  return extractStandingRows(raw) as unknown as Standing[];
}
