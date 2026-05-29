import { useQueries } from '@tanstack/react-query';
import { fetchLeague } from '../api/leagues';
import { fetchTeamsBySeason } from '../api/teams';
import { DIRECTORY_LEAGUE_IDS, LEAGUES } from '../../constants/leagues';

export interface SearchableLeague {
  id: number;
  name: string;
  image_path: string;
  sortOrder: number;
}

export interface SearchableTeam {
  id: number;
  name: string;
  short_code: string;
  image_path: string;
  league_id: number;
  league_name: string;
}

// Discriminated union — forward-compatible for adding players later.
export type SearchableEntity =
  | ({ type: 'league' } & SearchableLeague)
  | ({ type: 'team' } & SearchableTeam);
// | ({ type: 'player' } & SearchablePlayer)  — add when player detail exists

interface UseSearchableEntitiesResult {
  leagues: SearchableLeague[];
  teams: SearchableTeam[];
  isLoading: boolean;
  error: Error | null;
}

const STALE_24H = 24 * 60 * 60 * 1000;

export function useSearchableEntities(): UseSearchableEntitiesResult {
  // Step 1: Fetch league meta (image_path + currentSeason id).
  // Shares cache with useLeagueDirectory via the same ['league', id] keys.
  const leagueQueries = useQueries({
    queries: DIRECTORY_LEAGUE_IDS.map((id) => ({
      queryKey: ['league', id] as const,
      queryFn: () => fetchLeague(id),
      staleTime: STALE_24H,
    })),
  });

  const seasonIds = leagueQueries.map((q) => {
    const d = q.data;
    return d?.currentseason?.id ?? d?.currentSeason?.id ?? d?.current_season_id ?? null;
  });

  // Step 2: Fetch teams for each season, enabled once season IDs are known.
  const teamQueries = useQueries({
    queries: DIRECTORY_LEAGUE_IDS.map((_, i) => {
      const seasonId = seasonIds[i];
      return {
        queryKey: ['searchable-teams', seasonId ?? 0] as const,
        queryFn: () => (seasonId ? fetchTeamsBySeason(seasonId) : Promise.resolve([])),
        enabled: !!seasonId,
        staleTime: STALE_24H,
      };
    }),
  });

  const isLoading =
    leagueQueries.some((q) => q.isLoading) || teamQueries.some((q) => q.isLoading);

  const errors = [
    ...leagueQueries.map((q) => q.error),
    ...teamQueries.map((q) => q.error),
  ].filter((e): e is Error => e != null);

  // Build leagues with image_path filled in from API (fallback to '' until fetched).
  const leagues: SearchableLeague[] = DIRECTORY_LEAGUE_IDS.map((id, i) => ({
    id,
    name: LEAGUES[id as keyof typeof LEAGUES].displayName,
    image_path: leagueQueries[i].data?.image_path ?? '',
    sortOrder: LEAGUES[id as keyof typeof LEAGUES].sortOrder,
  }));

  // Aggregate teams across all leagues, deduplicate by team id.
  // When a team appears in two leagues, prefer the higher-tier one (lower sortOrder).
  const teamMap = new Map<number, SearchableTeam>();

  DIRECTORY_LEAGUE_IDS.forEach((leagueId, i) => {
    const raw = teamQueries[i].data ?? [];
    const leagueMeta = LEAGUES[leagueId as keyof typeof LEAGUES];

    for (const t of raw) {
      const existing = teamMap.get(t.id);
      const existingOrder =
        LEAGUES[existing?.league_id as keyof typeof LEAGUES]?.sortOrder ?? 99;

      if (!existing || leagueMeta.sortOrder < existingOrder) {
        teamMap.set(t.id, {
          id: t.id,
          name: t.name,
          short_code: t.short_code ?? t.name.slice(0, 3).toUpperCase(),
          image_path: t.image_path ?? '',
          league_id: leagueId,
          league_name: leagueMeta.displayName,
        });
      }
    }
  });

  return {
    leagues,
    teams: Array.from(teamMap.values()),
    isLoading,
    error: errors[0] ?? null,
  };
}
