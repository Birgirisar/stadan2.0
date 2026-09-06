import { smGet } from './sportmonks';
import type { LeagueFull, Season, StandingRow, StandingGroup } from './types';

/**
 * Pick the most recent season from a league's `seasons` list.
 * Prefers a season flagged `is_current`, then the latest `starting_at`,
 * then the highest id.
 */
export function pickLatestSeason(seasons: Season[] | undefined): Season | undefined {
  if (!seasons || seasons.length === 0) return undefined;
  return [...seasons].sort((a, b) => {
    if (!!a.is_current !== !!b.is_current) return a.is_current ? -1 : 1;
    const aStart = a.starting_at ? Date.parse(a.starting_at) : 0;
    const bStart = b.starting_at ? Date.parse(b.starting_at) : 0;
    if (aStart !== bStart) return bStart - aStart;
    return b.id - a.id;
  })[0];
}

/**
 * Resolve the season a league detail view should default to.
 *
 * Sportmonks clears `currentseason` for a league once its latest season ends
 * (e.g. Inkasso-Deildin / Lengjudeild karla after its 2026 season finished on
 * 2026-09-05). When that happens, fall back to the most recent season in the
 * `seasons` list so standings / scorers / teams still load.
 */
export function resolveLeagueSeasonId(league: LeagueFull | undefined): number | null {
  if (!league) return null;
  const direct =
    league.currentseason?.id ?? league.currentSeason?.id ?? league.current_season_id ?? null;
  return direct ?? pickLatestSeason(league.seasons)?.id ?? null;
}

// Sportmonks type_id → stat key mapping (used when details.type isn't included in response)
const STAT_TYPE_IDS: Record<string, number[]> = {
  played: [129],
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

// ─── Split-phase standings ────────────────────────────────────────────────────

function classifyByName(stageName: string): 'championship' | 'relegation' | null {
  const lower = stageName.toLowerCase();
  if (
    lower.includes('championship') ||
    lower.includes('upper') ||
    lower.includes('top') ||
    lower.includes('efri') ||
    lower.includes('meistara')
  ) {
    return 'championship';
  }
  if (
    lower.includes('relegation') ||
    lower.includes('lower') ||
    lower.includes('bottom') ||
    lower.includes('neðri') ||
    lower.includes('niður') ||
    lower.includes('survival')
  ) {
    return 'relegation';
  }
  return null;
}

/**
 * Parse a raw Sportmonks standings response into labelled stage groups.
 *
 * Sportmonks /standings/seasons/{id} returns a FLAT array of standing rows,
 * each carrying a `stage_id` foreign key. For regular leagues all rows share
 * the same stage_id; for split-phase leagues (Besta deild karla / kvenna)
 * rows from three different stages are mixed together — causing teams to
 * appear multiple times when naively flattened.
 *
 * This function groups by stage_id and returns the groups in display order:
 *   1. Efri hluti  (championship playoff group)
 *   2. Neðri hluti (relegation playoff group)
 *   3. Grunnkeppni (regular season – shown at the bottom for context)
 *
 * For single-stage (regular) leagues it returns one group with an empty label,
 * which is rendered the same way as before.
 */
export function extractStandingGroups(raw: unknown[]): StandingGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const first = raw[0] as Record<string, unknown>;

  // ── Flat format ───────────────────────────────────────────────────────────
  // Sportmonks /standings/seasons/{id} returns flat rows with a stage_id field.
  if (typeof first.position === 'number') {
    return groupFlatRows(raw as Array<Record<string, unknown>>);
  }

  // ── Stage-nested format (fallback for alternative endpoints) ─────────────
  const rawGroups: Array<{ stageId: number | undefined; stageName: string; rows: StandingRow[] }> = [];
  for (const stage of raw) {
    const s = stage as Record<string, unknown>;
    const stageId = typeof s.id === 'number' ? s.id : undefined;
    const stageName = typeof s.name === 'string' ? s.name : '';
    const nested = s.standings as Record<string, unknown> | undefined;
    const stageRows: StandingRow[] =
      (nested?.data as StandingRow[] | undefined) ??
      (Array.isArray(nested) ? (nested as StandingRow[]) : undefined) ??
      (s.data as StandingRow[] | undefined) ??
      [];
    if (Array.isArray(stageRows) && stageRows.length > 0) {
      rawGroups.push({ stageId, stageName, rows: [...stageRows].sort((a, b) => a.position - b.position) });
    }
  }

  if (rawGroups.length <= 1) {
    return rawGroups.map((g) => ({ ...g, label: '', type: 'regular' as const }));
  }
  return classifyAndOrder(rawGroups);
}

// ─── Flat-row grouping ────────────────────────────────────────────────────────

function groupFlatRows(rows: Array<Record<string, unknown>>): StandingGroup[] {
  // Group rows by stage_id — undefined means no stage separation
  const byStage = new Map<number | undefined, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const sid = typeof row.stage_id === 'number' ? row.stage_id : undefined;
    if (!byStage.has(sid)) byStage.set(sid, []);
    byStage.get(sid)!.push(row);
  }

  if (byStage.size <= 1) {
    return [{
      stageId: [...byStage.keys()][0],
      stageName: '',
      label: '',
      type: 'regular',
      rows: [...(rows as unknown as StandingRow[])].sort((a, b) => a.position - b.position),
    }];
  }

  // Multiple stages: build typed groups for classification
  const rawGroups = [...byStage.entries()].map(([sid, stageRows]) => {
    // Stage name may be available if ?include=stage was passed
    const stageName =
      ((stageRows[0].stage as Record<string, unknown> | undefined)?.name as string | undefined) ?? '';
    return {
      stageId: sid,
      stageName,
      rows: [...(stageRows as unknown as StandingRow[])].sort((a, b) => a.position - b.position),
    };
  });

  return classifyAndOrder(rawGroups);
}

// ─── Stage classification ─────────────────────────────────────────────────────

function classifyAndOrder(
  groups: Array<{ stageId: number | undefined; stageName: string; rows: StandingRow[] }>
): StandingGroup[] {
  // Regular season = stage with the most rows (all teams)
  const maxRows = Math.max(...groups.map((g) => g.rows.length));
  const regularIdx = groups.findIndex((g) => g.rows.length === maxRows);
  const regular = groups[regularIdx];
  const playoffs = groups.filter((_, i) => i !== regularIdx);

  if (playoffs.length === 0) {
    return [{ ...regular, label: '', type: 'regular' }];
  }

  // Build teamId → regular-season position for cross-referencing
  const regularPositions = new Map<number, number>();
  for (const row of regular.rows) {
    const tid = row.participant_id ?? row.team_id ?? row.participant?.id ?? 0;
    if (tid) regularPositions.set(tid, row.position);
  }

  // Classify playoff stages by name; fall back to average regular-season rank
  type WithMeta = (typeof playoffs)[0] & {
    playoffType: 'championship' | 'relegation';
    avgRegPos: number;
  };

  const withMeta: WithMeta[] = playoffs.map((g) => {
    const nameType = classifyByName(g.stageName);
    let total = 0, count = 0;
    for (const row of g.rows) {
      const tid = row.participant_id ?? row.team_id ?? row.participant?.id ?? 0;
      const pos = regularPositions.get(tid);
      if (pos !== undefined) { total += pos; count++; }
    }
    return { ...g, playoffType: nameType ?? 'championship', avgRegPos: count > 0 ? total / count : 999 };
  });

  // If all stages got the same classification from names (or none got any),
  // resolve via average regular-season position: lower avg = higher-ranked = championship
  if (withMeta.every((g) => g.playoffType === withMeta[0].playoffType)) {
    withMeta.sort((a, b) => a.avgRegPos - b.avgRegPos);
    withMeta[0].playoffType = 'championship';
    for (let i = 1; i < withMeta.length; i++) withMeta[i].playoffType = 'relegation';
  }

  return [
    ...withMeta
      .filter((g) => g.playoffType === 'championship')
      .map((g) => ({
        stageId: g.stageId,
        stageName: g.stageName,
        label: 'Efri hluti',
        type: 'championship' as const,
        rows: g.rows,
      })),
    ...withMeta
      .filter((g) => g.playoffType === 'relegation')
      .map((g) => ({
        stageId: g.stageId,
        stageName: g.stageName,
        label: 'Neðri hluti',
        type: 'relegation' as const,
        rows: g.rows,
      })),
    { stageId: regular.stageId, stageName: regular.stageName, label: 'Grunnkeppni', type: 'regular' as const, rows: regular.rows },
  ];
}

export async function fetchStandingsGrouped(seasonId: number): Promise<StandingGroup[]> {
  // Include `stage` so each row carries stage.name for better classification
  const raw = await smGet<unknown[]>(`/standings/seasons/${seasonId}`, {
    include: 'participant;form;details.type;rule;stage',
  });
  return extractStandingGroups(raw);
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
