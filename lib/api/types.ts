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
