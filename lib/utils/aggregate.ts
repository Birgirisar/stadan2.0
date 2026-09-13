import type { Fixture } from '../api/types';
import { getScore } from './score';

/**
 * Compute aggregate scorelines for two-legged ties within a flat list of
 * fixtures (e.g. a round-less play-off stage's fixtures — see
 * fetchRoundsForSeason). Groups fixtures by unordered team pair, accumulates
 * goals leg by leg (stopping at the first leg that hasn't kicked off yet),
 * and labels every leg from the second onward — leg 1 alone isn't an
 * "aggregate". Pairs with only one fixture (e.g. a single-match final) are
 * left unlabeled.
 */
export function computeAggregateScores(fixtures: Fixture[]): Map<number, string> {
  const map = new Map<number, string>();

  // De-duplicate by fixture id — callers may pass overlapping fetches
  // (e.g. two candidate fixtures from the same stage).
  const uniqueById = new Map<number, Fixture>();
  for (const f of fixtures) uniqueById.set(f.id, f);

  const byPair = new Map<string, Fixture[]>();
  for (const f of uniqueById.values()) {
    const ids = (f.participants ?? [])
      .map((p) => p.id)
      .sort((a, b) => a - b);
    if (ids.length !== 2) continue;
    const key = `${ids[0]}-${ids[1]}`;
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key)!.push(f);
  }

  for (const tie of byPair.values()) {
    if (tie.length < 2) continue; // single-match decider — no aggregate to show
    const legs = [...tie].sort((a, b) => (a.starting_at ?? '').localeCompare(b.starting_at ?? ''));

    const totals = new Map<number, number>();
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const score = getScore(leg);
      const home = leg.participants?.find((p) => p.meta.location === 'home');
      const away = leg.participants?.find((p) => p.meta.location === 'away');
      if (!home || !away || score.home == null || score.away == null) break; // this leg hasn't kicked off yet

      totals.set(home.id, (totals.get(home.id) ?? 0) + score.home);
      totals.set(away.id, (totals.get(away.id) ?? 0) + score.away);

      if (i > 0) {
        map.set(leg.id, `(${totals.get(home.id)}–${totals.get(away.id)})`);
      }
    }
  }

  return map;
}
