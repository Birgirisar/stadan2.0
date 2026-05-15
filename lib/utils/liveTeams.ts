import type { Fixture } from '../api/types';

export function getLiveTeamIds(fixtures: Fixture[], leagueId?: number): Set<number> {
  const live = leagueId
    ? fixtures.filter((f) => f.state?.is_live && f.league_id === leagueId)
    : fixtures.filter((f) => f.state?.is_live);

  const teamIds = new Set<number>();
  for (const f of live) {
    for (const p of f.participants ?? []) {
      teamIds.add(p.id);
    }
  }
  return teamIds;
}

export function getLiveCountByLeague(fixtures: Fixture[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const f of fixtures) {
    if (f.state?.is_live) {
      counts[f.league_id] = (counts[f.league_id] ?? 0) + 1;
    }
  }
  return counts;
}
