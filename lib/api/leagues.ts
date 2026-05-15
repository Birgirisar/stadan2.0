import { smGet } from './sportmonks';
import type { LeagueFull, StandingRow } from './types';

// Sportmonks type_id → stat key mapping (used when details.type isn't included in response)
const STAT_TYPE_IDS: Record<string, number[]> = {
  played: [140],
  won: [130],
  draw: [131],
  lost: [132],
  goals_scored: [133],
  goals_against: [134],
  goal_difference: [179],
  points: [187],
};

export async function fetchLeague(leagueId: number): Promise<LeagueFull> {
  return smGet<LeagueFull>(`/leagues/${leagueId}`, {
    include: 'currentSeason;seasons',
  });
}

export async function fetchStandingsForDirectory(seasonId: number): Promise<StandingRow[]> {
  const raw = await smGet<unknown[]>(`/standings/seasons/${seasonId}`, {
    include: 'participant;details.type',
  });
  return extractStandingRows(raw);
}

export async function fetchStandingsFull(seasonId: number): Promise<StandingRow[]> {
  const raw = await smGet<unknown[]>(`/standings/seasons/${seasonId}`, {
    include: 'participant;form;details.type;rule',
  });
  return extractStandingRows(raw);
}

export function extractStandingRows(raw: unknown[]): StandingRow[] {
  if (!Array.isArray(raw)) return [];

  // Flat array of standing rows (e.g. /standings/seasons/{id} endpoint)
  const first = raw[0] as Record<string, unknown> | undefined;
  if (first && typeof first.position === 'number') {
    return [...(raw as StandingRow[])].sort((a, b) => a.position - b.position);
  }

  // Stage-nested format (e.g. /standings/season/{id} endpoint)
  const rows: StandingRow[] = [];
  for (const stage of raw) {
    const s = stage as Record<string, unknown>;
    const nested = s?.standings as Record<string, unknown> | undefined;
    const stageRows: StandingRow[] =
      (nested?.data as StandingRow[] | undefined) ??
      (Array.isArray(nested) ? (nested as StandingRow[]) : undefined) ??
      (s?.data as StandingRow[] | undefined) ??
      [];
    if (Array.isArray(stageRows)) rows.push(...stageRows);
  }

  return rows.sort((a, b) => a.position - b.position);
}

export function extractStat(
  row: StandingRow,
  keys: string[],
  directField?: number
): number {
  if (directField !== undefined) return directField;
  if (!row.details) return 0;

  // Try matching by type object (developer_name / code / name)
  for (const d of row.details) {
    if (d.type) {
      const devName = (d.type.developer_name ?? '').toUpperCase();
      const code = (d.type.code ?? '').toLowerCase();
      const name = (d.type.name ?? '').toLowerCase();
      for (const key of keys) {
        if (
          devName.includes(key.toUpperCase()) ||
          code.includes(key.toLowerCase()) ||
          name.includes(key.toLowerCase())
        ) {
          return d.value ?? 0;
        }
      }
    }
  }

  // Fallback: match by known type_id when type objects aren't returned
  for (const key of keys) {
    const typeIds = STAT_TYPE_IDS[key.toLowerCase()];
    if (typeIds) {
      for (const d of row.details) {
        if (typeIds.includes(d.type_id)) return d.value ?? 0;
      }
    }
  }

  return 0;
}

export function extractPoints(row: StandingRow): number {
  const direct = (row as unknown as Record<string, number>)['points'];
  if (typeof direct === 'number') return direct;
  return extractStat(row, ['points', 'OVERALL_POINTS'], undefined);
}

export function parseForm(form: StandingRow['form']): string[] {
  if (!form) return [];
  if (typeof form === 'string') {
    return form.split('').filter((c) => ['W', 'D', 'L'].includes(c)).slice(0, 5);
  }
  if (Array.isArray(form)) {
    const sorted = [...form].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0));
    return sorted
      .slice(0, 5)
      .map((f): 'W' | 'D' | 'L' | null => {
        const r = f.result ?? f.form;
        if (!r) return null;
        const upper = r.toUpperCase();
        if (upper === 'W' || upper === 'WIN') return 'W';
        if (upper === 'D' || upper === 'DRAW') return 'D';
        if (upper === 'L' || upper === 'LOSS' || upper === 'LOSE') return 'L';
        return null;
      })
      .filter((x): x is 'W' | 'D' | 'L' => x !== null);
  }
  return [];
}
