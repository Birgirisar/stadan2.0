import { useQuery } from '@tanstack/react-query';
import {
  fetchTeam,
  fetchTeamSchedule,
  fetchTopScorers,
  type TeamInfo,
  type TopScorerEntry,
  type ScheduleStage,
} from '../api/teamDetail';
import { fetchStandings } from '../api/standings';
import { getScore } from '../utils/score';
import { computeForm, type FormEntry } from '../utils/form';
import type { Fixture, StandingRow } from '../api/types';
import { LEAGUES } from '../../constants/leagues';

// ── Derived types ─────────────────────────────────────────────────────────────

export type { TeamInfo, TopScorerEntry };

export interface SeasonStats {
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface TeamDetailData {
  team: TeamInfo | null;
  seasonId: number | null;
  leagueId: number | null;
  /** Next upcoming fixture */
  nextMatch: Fixture | null;
  /** Most recent finished fixture */
  lastMatch: Fixture | null;
  /** Last 5 finished form entries from this team's perspective */
  form: FormEntry[];
  /** All finished fixtures (for form) */
  recentFixtures: Fixture[];
  /** Full standings rows for mini-position */
  standings: StandingRow[] | null;
  /** Top scorers from this team */
  topScorers: TopScorerEntry[];
  /** Stats from the team's standings row */
  seasonStats: SeasonStats | null;
  // Loading states
  teamLoading: boolean;
  scheduleLoading: boolean;
  standingsLoading: boolean;
  scorersLoading: boolean;
  // Errors
  teamError: Error | null;
  scheduleError: Error | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** FINISHED state_id values — Sportmonks uses 5 for full-time */
const FINISHED_STATE_IDS = new Set([5, 6, 7, 8, 26, 52]);
/** LIVE state_id values */
const LIVE_STATE_IDS = new Set([2, 3, 13, 25]);

const NOW_TS = () => Math.floor(Date.now() / 1000);

function deriveSeasonAndLeague(stages: ScheduleStage[]): {
  seasonId: number | null;
  leagueId: number | null;
} {
  if (!stages.length) return { seasonId: null, leagueId: null };

  // 1. Prefer a current stage in one of our 5 supported leagues
  const supported = stages.find(
    (s) => s.is_current && (LEAGUES as Record<number, unknown>)[s.league_id]
  );
  if (supported) return { seasonId: supported.season_id, leagueId: supported.league_id };

  // 2. Any current stage
  const current = stages.find((s) => s.is_current);
  if (current) return { seasonId: current.season_id, leagueId: current.league_id };

  // 3. Fallback: most recent stage by starting_at
  const sorted = [...stages].sort((a, b) =>
    (b.starting_at ?? '').localeCompare(a.starting_at ?? '')
  );
  return { seasonId: sorted[0].season_id, leagueId: sorted[0].league_id };
}

function extractFixtures(stages: ScheduleStage[]): {
  lastMatch: Fixture | null;
  nextMatch: Fixture | null;
  recentFixtures: Fixture[];
} {
  const now = NOW_TS();
  const finished: Fixture[] = [];
  const upcoming: Fixture[] = [];

  for (const stage of stages) {
    for (const round of stage.rounds) {
      for (const fixture of round.fixtures ?? []) {
        const sid = fixture.state_id;
        if (FINISHED_STATE_IDS.has(sid) || LIVE_STATE_IDS.has(sid)) {
          // Include live too in "recent" so the last match card shows the live match
          finished.push(fixture);
        } else if (fixture.starting_at_timestamp > now) {
          upcoming.push(fixture);
        }
      }
    }
  }

  // Most recent finished first
  finished.sort((a, b) => (b.starting_at_timestamp ?? 0) - (a.starting_at_timestamp ?? 0));
  // Soonest upcoming first
  upcoming.sort((a, b) => (a.starting_at_timestamp ?? 0) - (b.starting_at_timestamp ?? 0));

  return {
    lastMatch: finished[0] ?? null,
    nextMatch: upcoming[0] ?? null,
    recentFixtures: finished.slice(0, 5),
  };
}

function extractSeasonStats(
  standings: StandingRow[] | null,
  teamId: number
): SeasonStats | null {
  if (!standings) return null;

  const row = standings.find(
    (r) =>
      (r.participant_id ?? r.team_id ?? r.participant?.id) === teamId
  );
  if (!row) return null;

  // Try to pull stats from details array first, then direct fields
  function getDetail(keys: string[]): number {
    if (row!.details) {
      for (const d of row!.details) {
        const devName = (d.type?.developer_name ?? '').toUpperCase();
        const code = (d.type?.code ?? '').toLowerCase();
        for (const key of keys) {
          if (devName.includes(key.toUpperCase()) || code.includes(key.toLowerCase())) {
            return d.value ?? 0;
          }
        }
      }
    }
    return 0;
  }

  const played = getDetail(['overall_matches_played', 'matches_played']) ||
    (row as any).overall_matches_played || (row as any).played || 0;
  const won = getDetail(['overall_won', 'won']) || (row as any).overall_won || (row as any).won || 0;
  const draw = getDetail(['overall_draw', 'draw']) || (row as any).overall_draw || (row as any).draw || 0;
  const lost = getDetail(['overall_lost', 'lost']) || (row as any).overall_lost || (row as any).lost || 0;
  const goalsFor = getDetail(['overall_goals_scored', 'goals_scored']) ||
    (row as any).overall_goals_scored || (row as any).goals_scored || 0;
  const goalsAgainst = getDetail(['overall_goals_against', 'goals_against']) ||
    (row as any).overall_goals_against || (row as any).goals_against || 0;
  const points = getDetail(['overall_points', 'points']) ||
    (row as any).overall_points || (row as any).points || 0;

  return { played, won, draw, lost, goalsFor, goalsAgainst, points };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTeamDetail(teamId: number): TeamDetailData {
  // ── Team info ──────────────────────────────────────────────────────────────
  const {
    data: team,
    isLoading: teamLoading,
    error: teamError,
  } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeam(teamId),
    staleTime: 5 * 60 * 1000,
    enabled: !!teamId,
  });

  // ── Schedule (recent + upcoming fixtures + seasonId) ───────────────────────
  const {
    data: stages,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useQuery({
    queryKey: ['team-schedule', teamId],
    queryFn: () => fetchTeamSchedule(teamId),
    staleTime: 60 * 1000,
    enabled: !!teamId,
  });

  // Derive season/league from schedule
  const { seasonId, leagueId } = deriveSeasonAndLeague(stages ?? []);

  // Derive next/last match + recent form from schedule
  const { lastMatch, nextMatch, recentFixtures } = extractFixtures(stages ?? []);
  const form = computeForm(recentFixtures, teamId);

  // ── Standings (only if we have a season in a supported league) ────────────
  const inSupportedLeague = leagueId != null && !!(LEAGUES as Record<number, unknown>)[leagueId];
  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ['standings', seasonId],
    queryFn: () => fetchStandings(seasonId!),
    staleTime: 5 * 60 * 1000,
    enabled: inSupportedLeague && seasonId != null,
  });

  // ── Top scorers (only if we have a supported league season) ───────────────
  const { data: allScorers, isLoading: scorersLoading } = useQuery({
    queryKey: ['top-scorers', seasonId],
    queryFn: () => fetchTopScorers(seasonId!),
    staleTime: 5 * 60 * 1000,
    enabled: inSupportedLeague && seasonId != null,
  });

  const topScorers = (allScorers ?? [])
    .filter((s) => s.participant_id === teamId)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // ── Season stats from standings ────────────────────────────────────────────
  const seasonStats = extractSeasonStats(standings as StandingRow[] ?? null, teamId);

  return {
    team: team ?? null,
    seasonId,
    leagueId,
    nextMatch,
    lastMatch,
    form,
    recentFixtures,
    standings: (standings as StandingRow[] ?? null),
    topScorers,
    seasonStats,
    teamLoading,
    scheduleLoading,
    standingsLoading,
    scorersLoading,
    teamError: teamError as Error | null,
    scheduleError: scheduleError as Error | null,
  };
}
