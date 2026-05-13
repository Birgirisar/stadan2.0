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

export interface LineupEntry {
  id: number;
  player_id: number;
  team_id: number;
  position?: string | null;
  jersey_number?: number | null;
  rating?: number | null;
  player?: Player | null;
}

export interface Period {
  id: number;
  fixture_id: number;
  started?: number | null;
  ended?: number | null;
  sort_order: number;
  type_code?: string;
}

export interface StatisticEntry {
  type_id: number;
  participant_id: number;
  data?: { value: number | string | null };
  type?: { name: string; code: string; developer_name?: string };
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
  details?: Array<{ type_id: number; value: number }>;
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
}
