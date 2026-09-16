import type { Fixture } from '../api/types';

// How long to keep polling a knockout fixture past its first "Full Time"
// reading, in case it continues into extra time.
const GRACE_MS = 20 * 60_000;

// fixture id -> ms timestamp we first observed it reach "FT"
const firstFullTimeAt = new Map<number, number>();

/**
 * A round-less fixture (no `round` — see fetchRoundsForSeason) is a
 * knockout leg, which can continue into extra time if level. Sportmonks
 * reports the 90-minute mark as state "FT" — the same code a normal,
 * already-decided match ends on — before (if applicable) flipping to an
 * extra-time in-play code. Every live-polling gate in the app stops as soon
 * as it sees a "finished" state, so if that FT reading is caught first,
 * polling stops and a later flip to extra time is never picked up.
 *
 * This tracks (client-side, per fixture id) how long ago a knockout fixture
 * first hit "FT" and says whether it's still within a grace window where
 * polling should continue, just in case. Codes that only occur once a match
 * is unambiguously over for good (AET, FT_PEN, etc.) are deliberately NOT
 * covered — only the ambiguous 90-minute "FT" code is.
 */
export function isAwaitingPossibleExtraTime(fixture: Pick<Fixture, 'id' | 'round' | 'state'>): boolean {
  if (fixture.round) return false; // normal league fixtures never go to extra time
  if (fixture.state?.state !== 'FT') return false;

  const now = Date.now();
  const firstSeen = firstFullTimeAt.get(fixture.id);
  if (firstSeen == null) {
    firstFullTimeAt.set(fixture.id, now);
    return true;
  }
  return now - firstSeen < GRACE_MS;
}
