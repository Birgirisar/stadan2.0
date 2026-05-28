import { smGet } from './sportmonks';
import type { Fixture } from './types';

// ── Team info ─────────────────────────────────────────────────────────────────

export interface TeamVenue {
  id: number;
  name: string;
  city_name?: string;
  address?: string;
  capacity?: number;
  surface?: string;
  image_path?: string;
}

export interface TeamCoachEntry {
  id: number;
  team_id: number;
  coach_id: number;
  active: boolean;
  start?: string;
  end?: string | null;
  coach?: {
    id: number;
    name: string;
    common_name?: string;
    display_name?: string;
    firstname?: string;
    lastname?: string;
    image_path?: string;
  };
}

export interface TeamCountry {
  id: number;
  name: string;
  image_path?: string;
}

export interface TeamInfo {
  id: number;
  name: string;
  short_code?: string | null;
  image_path?: string;
  founded?: number | null;
  gender?: string;
  venue?: TeamVenue | null;
  coaches?: TeamCoachEntry[];
  country?: TeamCountry | null;
}

export async function fetchTeam(teamId: number): Promise<TeamInfo> {
  return smGet<TeamInfo>(`/teams/${teamId}`, {
    include: 'venue;coaches.coach;country',
  });
}

// ── Team schedule (fixtures with participants + scores) ───────────────────────

export interface ScheduleStage {
  id: number;
  league_id: number;
  season_id: number;
  name: string;
  is_current: boolean;
  starting_at?: string;
  ending_at?: string;
  rounds: ScheduleRound[];
}

export interface ScheduleRound {
  id: number;
  name: string;
  finished: boolean;
  starting_at?: string | null;
  ending_at?: string | null;
  fixtures: Fixture[];
}

export async function fetchTeamSchedule(teamId: number): Promise<ScheduleStage[]> {
  const raw = await smGet<ScheduleStage[]>(`/schedules/teams/${teamId}`);
  return Array.isArray(raw) ? raw : [];
}

// ── Top scorers ───────────────────────────────────────────────────────────────

export interface TopScorerEntry {
  id: number;
  season_id: number;
  player_id: number;
  type_id: number;
  position: number;
  /** Goals scored */
  total: number;
  participant_id: number;
  player?: {
    id: number;
    name: string;
    common_name?: string;
    display_name?: string;
    image_path?: string;
    position_id?: number;
  };
  participant?: {
    id: number;
    name: string;
    short_code?: string | null;
    image_path?: string;
  };
}

/** Fetch top scorers for a season via the season endpoint (more accurate data). */
export async function fetchTopScorers(seasonId: number): Promise<TopScorerEntry[]> {
  try {
    const season = await smGet<{ topscorers?: TopScorerEntry[] }>(`/seasons/${seasonId}`, {
      include: 'topscorers.player;topscorers.participant',
    });
    return Array.isArray(season?.topscorers) ? season.topscorers : [];
  } catch {
    return [];
  }
}
