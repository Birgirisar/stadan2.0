import type { FixtureState, Period } from '../api/types';

export type MatchStateResult = {
  type: 'pending' | 'live' | 'halftime' | 'finished' | 'cancelled';
  label: string;
  showScore: boolean;
};

// State code sets derived from Sportmonks developer_name / state values
const FINAL_CODES = new Set(['FT', 'AET', 'FT_PEN', 'AWARDED', 'WO']);
const LIVE_CODES = new Set(['1H', '2H', 'ET', 'ET_BREAK', 'PEN_BREAK', 'PEN', 'LIVE']);
const CANCELLED_CODES = new Set(['POSTP', 'CANC', 'ABANDON', 'SUSP', 'INT']);

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
  const isFinal = FINAL_CODES.has(code) || state.is_final_state === true;
  const isLive = LIVE_CODES.has(code) || state.is_live === true;
  const isHalfTime = code === 'HT';
  const isCancelled = CANCELLED_CODES.has(code) || state.is_cancelled === true;

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
