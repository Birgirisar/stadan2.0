import type { Fixture, ScoreEntry } from '../api/types';

const FALLBACK_PRIORITY = [
  'PENALTY_SHOOTOUT',
  'ET_2ND_HALF',
  '2ND_HALF',
  '1ST_HALF',
] as const;

function pickByLocation(
  entries: ScoreEntry[],
  locMap: Map<number, 'home' | 'away'>
): { home: number | null; away: number | null } {
  let home: number | null = null;
  let away: number | null = null;
  for (const e of entries) {
    // prefer participant_id → location map; fall back to score.participant field
    const loc = locMap.get(e.participant_id) ?? e.score.participant;
    if (loc === 'home') home = e.score.goals;
    else if (loc === 'away') away = e.score.goals;
  }
  return { home, away };
}

export function getScore(fixture: Fixture): { home: number | null; away: number | null } {
  const scores = fixture.scores ?? [];
  if (!scores.length) return { home: null, away: null };

  // Build participant_id → home/away from the participants array
  const locMap = new Map<number, 'home' | 'away'>();
  for (const p of fixture.participants ?? []) {
    locMap.set(p.id, p.meta.location);
  }

  // 1. CURRENT is present during live matches
  const current = scores.filter((s) => s.description === 'CURRENT');
  if (current.length) return pickByLocation(current, locMap);

  // 2. For finished/halftime: pick the highest-period entry available
  //    These are cumulative totals, so we take the single best entry per participant
  for (const desc of FALLBACK_PRIORITY) {
    const entries = scores.filter((s) => s.description === desc);
    if (entries.length) return pickByLocation(entries, locMap);
  }

  return { home: null, away: null };
}
