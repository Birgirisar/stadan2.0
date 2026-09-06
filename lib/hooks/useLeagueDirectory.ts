import { useQueries } from '@tanstack/react-query';
import { fetchLeague, fetchStandingsForDirectory, extractPoints, pickLatestSeason, resolveLeagueSeasonId } from '../api/leagues';
import type { LeagueSummary, Season, StandingRow } from '../api/types';
import { useFixturesByDate } from '../api/fixtures';
import { getLiveCountByLeague } from '../utils/liveTeams';
import { DIRECTORY_LEAGUE_IDS, LEAGUES } from '../../constants/leagues';

function deriveSeasonState(season: Season | undefined): 'active' | 'upcoming' | 'finished' {
  if (!season) return 'active';
  if (season.finished) return 'finished';
  const now = Date.now();
  const start = season.starting_at ? new Date(season.starting_at).getTime() : 0;
  if (start > now) return 'upcoming';
  return 'active';
}

function seasonYear(season: Season | undefined): string {
  if (!season) return '';
  // name is usually "2025" or "Season 2025"
  const match = season.name?.match(/\d{4}/);
  return match ? match[0] : '';
}

function leaderFromRow(row: StandingRow | undefined) {
  if (!row?.participant) return null;
  return {
    name: row.participant.name,
    shortCode: row.participant.short_code ?? row.participant.name.slice(0, 3).toUpperCase(),
    imagePath: row.participant.image_path ?? '',
    points: extractPoints(row),
    teamId: row.participant_id ?? row.team_id ?? row.participant.id,
  };
}

export function useLeagueDirectory() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayFixtures = [] } = useFixturesByDate(today);
  const liveByLeague = getLiveCountByLeague(todayFixtures);

  const leagueQueries = useQueries({
    queries: DIRECTORY_LEAGUE_IDS.map((id) => ({
      queryKey: ['league', id],
      queryFn: () => fetchLeague(id),
      staleTime: 60_000,
    })),
  });

  const seasonIds = leagueQueries.map((q) => resolveLeagueSeasonId(q.data));

  const standingQueries = useQueries({
    queries: DIRECTORY_LEAGUE_IDS.map((leagueId, i) => {
      const seasonId = seasonIds[i];
      return {
        queryKey: ['standings-dir', leagueId, seasonId ?? 0],
        queryFn: () => (seasonId ? fetchStandingsForDirectory(seasonId) : Promise.resolve([])),
        enabled: !!seasonId,
        staleTime: 60_000,
      };
    }),
  });

  const isLoading = leagueQueries.some((q) => q.isLoading);

  const summaries: LeagueSummary[] = DIRECTORY_LEAGUE_IDS.map((leagueId, i) => {
    const league = leagueQueries[i].data;
    const standings: StandingRow[] = standingQueries[i].data ?? [];
    const currentSeason = league?.currentseason ?? league?.currentSeason ?? pickLatestSeason(league?.seasons);
    const seasonState = deriveSeasonState(currentSeason);
    const topRow = standings[0];

    return {
      leagueId,
      name: LEAGUES[leagueId as keyof typeof LEAGUES]?.displayName ?? league?.name ?? '',
      imagePath: league?.image_path ?? '',
      isWomens: leagueId === 1710 || leagueId === 1711,
      currentSeasonId: resolveLeagueSeasonId(league),
      currentSeasonYear: seasonYear(currentSeason),
      seasonState,
      startingAt: currentSeason?.starting_at ?? null,
      leader: seasonState !== 'finished' ? leaderFromRow(topRow) : null,
      champion: seasonState === 'finished' ? leaderFromRow(topRow) : null,
      liveCount: liveByLeague[leagueId] ?? 0,
      seasons: league?.seasons ?? [],
    };
  });

  return { summaries, isLoading };
}
