export interface Participant {
  id: number;
  name: string;
  short_code: string;
  image_path: string;
  meta: {
    location: 'home' | 'away';
    winner: boolean | null;
  };
}

export interface ScoreEntry {
  type_id: number;
  participant_id: number;
  score: {
    goals: number;
    participant: 'home' | 'away';
  };
  description: string;
}

export interface FixtureState {
  id: number;
  name: string;
  short_name?: string;
  developer_name?: string;
  state: string;
  // These boolean flags are not always returned by the API — derive from state string when absent
  is_live?: boolean;
  is_pending?: boolean;
  is_final_state?: boolean;
  is_cancelled?: boolean;
}

export interface League {
  id: number;
  name: string;
  image_path: string;
}

export interface Round {
  id: number;
  name: string;
}

/** Full round object returned from /seasons/{id}?include=rounds or /rounds/{id} */
export interface RoundFull {
  id: number;
  name: string;
  finished: boolean;
  starting_at: string | null;
  ending_at: string | null;
  /**
   * Embedded fixtures. Present when fetched via /rounds/{id}?include=fixtures.*,
   * or synthesized for a round-less stage (e.g. a promotion play-off with no
   * native Round objects) — see fetchRoundsForSeason. In the latter case `id`
   * is a synthetic value (not a real Sportmonks round id), so fixtures must be
   * refetched via fetchFixturesByIds rather than fetchFixturesForRound.
   */
  fixtures?: Fixture[];
  /**
   * Set when this entry represents multiple concurrent playoff rounds merged
   * into one display chip (e.g. championship group + relegation group playing
   * on the same matchday). Fetching fixtures for this round should use ALL
   * IDs in this array so both groups' games are shown together.
   */
  mergedIds?: number[];
}

export interface Fixture {
  id: number;
  league_id: number;
  state_id: number;
  starting_at: string;
  starting_at_timestamp: number;
  name: string;
  participants?: Participant[];
  scores?: ScoreEntry[];
  state?: FixtureState;
  league?: League;
  round?: Round;
  periods?: Period[];
  events?: FixtureEvent[];
}

export interface SportmonksResponse<T> {
  data: T;
  pagination?: {
    count: number;
    per_page: number;
    current_page: number;
    next_page: string | null;
    has_more: boolean;
  };
}

export interface Venue {
  id: number;
  name: string;
  city_name?: string;
}

export interface Player {
  id: number;
  name: string;
  common_name?: string;
  firstname?: string;
  lastname?: string;
  position_id?: number;
  display_name?: string;
  image_path?: string;
}

export interface EventType {
  id: number;
  name: string;
  code: string;
  developer_name?: string;
}

export interface FixtureEvent {
  id: number;
  fixture_id: number;
  period_id?: number | null;
  participant_id: number;
  type_id: number;
  minute: number;
  extra_minute?: number | null;
  player_id?: number | null;
  related_player_id?: number | null;
  player_name?: string | null;
  related_player_name?: string | null;
  player?: Player | null;
  related_player?: Player | null;
  type?: EventType | null;
}

export interface LineupDetail {
  id: number;
  type_id: number;
  value?: number | string | null;
  type?: { id: number; name: string; code?: string; developer_name?: string };
}

// Coach objects returned directly in fixture.coaches[].
// Team is identified via meta.participant_id (not a top-level team_id).
export interface Coach {
  id: number;
  firstname?: string;
  lastname?: string;
  name?: string;
  common_name?: string;
  display_name?: string;
  image_path?: string;
  meta?: {
    fixture_id?: number;
    coach_id?: number;
    participant_id?: number; // team ID
  };
}

export interface Formation {
  id: number;
  fixture_id?: number;
  team_id: number;
  formation: string;
}

export interface LineupEntry {
  id: number;
  player_id: number;
  team_id: number;
  position?: string | null;
  jersey_number?: number | null;
  rating?: number | null;
  player?: Player | null;
  player_name?: string | null;
  type_id?: number;
  formation_field?: string | null;
  formation_position?: number | null;
  captain?: boolean;
  position_id?: number | null;
  details?: LineupDetail[];
}

export interface Period {
  id: number;
  fixture_id: number;
  started?: number | null;
  ended?: number | null;
  sort_order: number;
  type_code?: string;
  ticking?: boolean;
  minutes?: number | null;
  seconds_elapsed?: number | null;
}

export interface StatisticEntry {
  type_id: number;
  participant_id: number;
  data?: { value: number | string | null };
  type?: { name: string; code: string; developer_name?: string };
}

/**
 * A labelled group of standing rows for one stage (e.g. regular season,
 * championship playoff, relegation playoff). Used for split-phase leagues
 * like Besta deild karla / kvenna.
 */
export interface StandingGroup {
  stageId?: number;
  /** Raw stage name as returned by the API */
  stageName: string;
  /** Icelandic display label shown as a section header */
  label: string;
  /** Distinguishes the regular season stage from playoff stages */
  type: 'regular' | 'championship' | 'relegation';
  rows: StandingRow[];
}

export interface Standing {
  position: number;
  team_id?: number;
  participant_id?: number;
  participant?: Participant;
  played?: number;
  won?: number;
  draw?: number;
  lost?: number;
  goals_scored?: number;
  goals_against?: number;
  goal_difference?: number;
  points?: number;
  // Sportmonks v3 sometimes nests stats under `details`
  details?: Array<{
    type_id: number;
    value: number;
    type?: { id: number; name: string; code: string; developer_name?: string };
  }>;
}

export interface Season {
  id: number;
  league_id: number;
  name: string;
  starting_at?: string;
  ending_at?: string;
  is_current?: boolean;
  finished?: boolean;
}

export interface LeagueFull {
  id: number;
  name: string;
  image_path: string;
  current_season_id?: number;
  currentSeason?: Season;
  currentseason?: Season; // API returns lowercase "currentseason"
  seasons?: Season[];
}

export interface StandingRule {
  id?: number;
  name?: string;
  type?: string;
}

export interface StandingRow {
  position: number;
  participant_id?: number;
  team_id?: number;
  participant?: {
    id: number;
    name: string;
    short_code?: string;
    image_path?: string;
  };
  details?: Array<{
    type_id: number;
    value: number;
    type?: { id: number; name: string; code: string; developer_name?: string };
  }>;
  // form can be an array of recent results or a raw string like "WWDLW"
  // API returns objects with either `result` or `form` field, plus `sort_order`
  form?: Array<{ result?: string; form?: string; fixture_id?: number; sort_order?: number }> | string;
  rule?: StandingRule | null;
  rule_id?: number;
}

export interface LeagueSummary {
  leagueId: number;
  name: string;
  imagePath: string;
  isWomens: boolean;
  currentSeasonId: number | null;
  currentSeasonYear: string;
  seasonState: 'active' | 'upcoming' | 'finished';
  startingAt: string | null;
  leader: { name: string; shortCode: string; imagePath: string; points: number; teamId?: number } | null;
  champion: { name: string; shortCode: string; imagePath: string; teamId?: number } | null;
  liveCount: number;
  seasons: Season[];
}

export interface CommentaryEntry {
  id: number;
  fixture_id: number;
  comment: string;
  minute: number | null;
  extra_minute: number | null;
  is_goal: boolean;
  is_important: boolean;
  order: number;
}

export interface DetailedFixture extends Fixture {
  season_id?: number;
  venue_id?: number;
  venue?: Venue;
  events?: FixtureEvent[];
  lineups?: LineupEntry[];
  periods?: Period[];
  statistics?: StatisticEntry[];
  meta?: Record<string, unknown>;
  league?: League & { current_season_id?: number };
  formations?: Formation[];
  coaches?: Coach[];
  expectedLineups?: LineupEntry[];
}
