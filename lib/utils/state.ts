import type { FixtureState, Period } from '../api/types';

export type MatchStateResult = {
  type: 'pending' | 'live' | 'halftime' | 'finished' | 'cancelled';
  label: string;
  showScore: boolean;
};

// State code sets — Sportmonks v3 returns developer_name-style strings in state.state
// (e.g. "INPLAY_1ST_HALF", not the old short codes like "1H").
// We keep the old short codes as well so finished/cached data still works.
const FINAL_CODES = new Set([
  // Sportmonks v3 developer names
  'FT', 'AET', 'FT_PEN', 'AWARDED', 'WO',
  'FINISHED', 'FULL_TIME', 'AFTER_EXTRA_TIME', 'AFTER_PENALTIES',
]);
const LIVE_CODES = new Set([
  // Sportmonks v3 developer names
  'INPLAY_1ST_HALF', 'INPLAY_2ND_HALF',
  'INPLAY_ET', 'INPLAY_ET_2ND_HALF',
  'INPLAY_PENALTIES', 'BREAK_TIME',
  // Legacy short codes (kept for safety)
  '1H', '2H', 'ET', 'BT', 'ET_BREAK', 'PEN_BREAK', 'PEN', 'LIVE',
]);
const CANCELLED_CODES = new Set([
  'POSTP', 'POSTPONED',
  'CANC', 'CANCELLED',
  'ABAN', 'ABANDON', 'ABANDONED',
  'SUSP', 'SUSPENDED',
  'INT', 'INTERRUPTED',
]);

export function getLiveMinute(periods: Period[] | undefined): string | null {
  if (!periods?.length) return null;
  const active = periods.find((p) => p.ticking === true);
  if (active != null && active.minutes != null) return `${active.minutes}'`;
  return null;
}

export function getMatchState(state: FixtureState | undefined): MatchStateResult {
  if (!state) return { type: 'pending', label: '', showScore: false };

  const code = state.state ?? '';

  // Derive from state string first; fall back to boolean flags if present
  const isFinal = FINAL_CODES.has(code) || !!state.is_final_state;
  const isLive = LIVE_CODES.has(code) || !!state.is_live;
  const isHalfTime = code === 'HT' || code === 'HALF_TIME';
  const isCancelled = CANCELLED_CODES.has(code) || !!state.is_cancelled;

  if (isCancelled) {
    const label = code === 'POSTP' ? 'Frestað' : 'Aflýst';
    return { type: 'cancelled', label, showScore: false };
  }

  if (isFinal) {
    let label = 'FT';
    if (code === 'AET') label = 'AET';
    else if (code === 'FT_PEN') label = 'Skor';
    return { type: 'finished', label, showScore: true };
  }

  if (isHalfTime) {
    return { type: 'halftime', label: 'HT', showScore: true };
  }

  if (isLive) {
    return { type: 'live', label: '', showScore: true };
  }

  return { type: 'pending', label: '', showScore: false };
}
