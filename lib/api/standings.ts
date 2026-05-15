import type { Standing } from './types';
import { smGet } from './sportmonks';

export async function fetchStandings(seasonId: number): Promise<Standing[]> {
  const raw = await smGet<unknown[]>(`/standings/seasons/${seasonId}`, {
    include: 'participant',
  });

  if (!Array.isArray(raw)) return [];

  const standings: Standing[] = [];
  for (const stage of raw) {
    // Sportmonks v3 nests rows under `standings.data` or `standings` or `data`
    const s = stage as Record<string, unknown>;
    const nested = s?.standings as Record<string, unknown> | undefined;
    const rows =
      (nested?.data as Standing[] | undefined) ??
      (nested as Standing[] | undefined) ??
      (s?.data as Standing[] | undefined) ??
      [];
    if (Array.isArray(rows)) standings.push(...rows);
  }
  return standings;
}
