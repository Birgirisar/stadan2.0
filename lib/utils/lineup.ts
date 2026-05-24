import type { DetailedFixture, LineupEntry, FixtureEvent, Coach, Participant } from '../api/types';

// Sportmonks returns a generic jersey image URL for players without a real photo.
// Treat any URL containing "placeholder" as no image so our silhouette shows instead.
export function isValidPlayerImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return !url.toLowerCase().includes('placeholder');
}

export type LineupState = 'confirmed' | 'predicted' | 'empty';

export interface TeamLineup {
  starters: LineupEntry[];
  subs: LineupEntry[];
  formation: string;
  coach: Coach | null;
}

export interface SplitLineupResult {
  state: LineupState;
  home: TeamLineup;
  away: TeamLineup;
}

export function splitLineup(
  fixture: DetailedFixture,
  homeTeamId: number,
  awayTeamId: number
): SplitLineupResult {
  const lineups = fixture.lineups ?? [];
  const expectedLineups = fixture.expectedLineups ?? [];

  let entries = lineups;
  let state: LineupState = 'confirmed';

  if (lineups.length === 0 && expectedLineups.length > 0) {
    entries = expectedLineups;
    state = 'predicted';
  } else if (lineups.length === 0) {
    state = 'empty';
  }

  const formations = fixture.formations ?? [];
  const coachEntries = fixture.coaches ?? [];

  const getFormation = (teamId: number) =>
    formations.find(f => f.team_id === teamId)?.formation ?? '';

  const getCoach = (teamId: number): Coach | null =>
    coachEntries.find(c => c.meta?.participant_id === teamId) ?? null;

  const homeEntries = entries.filter(e => e.team_id === homeTeamId);
  const awayEntries = entries.filter(e => e.team_id === awayTeamId);

  const toTeamLineup = (teamEntries: LineupEntry[], teamId: number): TeamLineup => ({
    starters: teamEntries.filter(e => e.type_id === 11),
    subs: teamEntries.filter(e => e.type_id === 12),
    formation: getFormation(teamId),
    coach: getCoach(teamId),
  });

  return {
    state,
    home: toTeamLineup(homeEntries, homeTeamId),
    away: toTeamLineup(awayEntries, awayTeamId),
  };
}

export type StatusIconType = 'goal' | 'own-goal' | 'assist' | 'yellow' | 'red' | 'sub-off';

// Last word of a name, lowercased — used as a name-based fallback when event has no player ID.
function lastName(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? '').toLowerCase();
}

// Resolve the effective player/related-player ID from an event, falling back to the nested object.
function evIds(event: FixtureEvent): { pid: number | null; rid: number | null } {
  return {
    pid: event.player_id || event.player?.id || null,
    rid: event.related_player_id || event.related_player?.id || null,
  };
}

// Returns true when the event's player slot matches: ID first, last-name fallback only when event
// has no ID at all (prevents false positives on events that do carry an ID).
function matchesPlayer(
  evPid: number | null,
  evName: string | null | undefined,
  playerId: number,
  playerName: string | null | undefined,
): boolean {
  if (evPid) return evPid === playerId;
  // No ID on event — fall back to last-name comparison
  const evLast = lastName(evName);
  const entryLast = lastName(playerName);
  return !!(evLast && entryLast && evLast === entryLast);
}

export function getPlayerStatusIcons(
  playerId: number,
  playerName: string | null | undefined,
  events: FixtureEvent[],
): StatusIconType[] {
  const icons: StatusIconType[] = [];
  if (!playerId && !playerName) return icons;
  for (const event of events) {
    const { pid, rid } = evIds(event);
    const evPlayerName = event.player_name ?? event.player?.name;
    const evRelatedName = event.related_player_name ?? event.related_player?.name;
    if (matchesPlayer(pid, evPlayerName, playerId, playerName)) {
      if (event.type_id === 14 || event.type_id === 16) icons.push('goal');
      else if (event.type_id === 15) icons.push('own-goal');
      else if (event.type_id === 17) icons.push('assist');
      else if (event.type_id === 19) icons.push('yellow');
      else if (event.type_id === 20 || event.type_id === 21) icons.push('red');
    }
    // related slot = player who went OFF (sub) or assister (goal)
    if (event.type_id === 18 && matchesPlayer(rid, evRelatedName, playerId, playerName)) {
      icons.push('sub-off');
    }
    if ((event.type_id === 14 || event.type_id === 16) && matchesPlayer(rid, evRelatedName, playerId, playerName)) {
      icons.push('assist');
    }
  }
  return icons;
}

export function getSubOnInfo(
  playerId: number,
  playerName: string | null | undefined,
  events: FixtureEvent[],
): { minute: number } | null {
  if (!playerId && !playerName) return null;
  for (const event of events) {
    const { pid } = evIds(event);
    const evPlayerName = event.player_name ?? event.player?.name;
    if (event.type_id === 18 && matchesPlayer(pid, evPlayerName, playerId, playerName)) {
      return { minute: event.minute };
    }
  }
  return null;
}

export function getSubStatusIcons(
  playerId: number,
  playerName: string | null | undefined,
  events: FixtureEvent[],
): StatusIconType[] {
  const icons: StatusIconType[] = [];
  if (!playerId && !playerName) return icons;
  for (const event of events) {
    const { pid, rid } = evIds(event);
    const evPlayerName = event.player_name ?? event.player?.name;
    const evRelatedName = event.related_player_name ?? event.related_player?.name;
    if (matchesPlayer(pid, evPlayerName, playerId, playerName)) {
      if (event.type_id === 19) icons.push('yellow');
      else if (event.type_id === 20 || event.type_id === 21) icons.push('red');
    }
    if (event.type_id === 18 && matchesPlayer(rid, evRelatedName, playerId, playerName)) {
      icons.push('sub-off');
    }
  }
  return icons;
}

// GK position_id in Sportmonks is typically 24
export const GK_POSITION_ID = 24;

export function getTeamColor(
  _participant: Participant | undefined,
  isGK: boolean,
  isHome: boolean
): string {
  if (isGK) return '#f5c518';
  return isHome ? '#d61f3a' : '#1a1a1a';
}

// Use this in components — falls back to entry.player_name when player object is absent.
export function entryFamilyName(entry: import('../api/types').LineupEntry): string {
  if (entry.player) return getPlayerFamilyName(entry.player);
  if (entry.player_name) {
    const parts = entry.player_name.trim().split(' ');
    return parts[parts.length - 1] ?? entry.player_name;
  }
  return '';
}

// Smart name formatter for the pitch. Priority order:
//   1. "First Middle"  — if middle exists and fits (≤13 chars)
//   2. "First Last"    — if last exists and fits
//   3. "First M. L."  — first name + initials for middle and last
// Two middle names: only the first middle is considered; the second is dropped.
// Never uses ellipsis — caller should NOT set numberOfLines.
export function entryFullName(entry: import('../api/types').LineupEntry): string {
  const p = entry.player;

  let first = '', middle = '', last = '';

  if (p?.firstname && p?.lastname) {
    const firstParts = p.firstname.trim().split(/\s+/);
    first = firstParts[0] ?? '';
    middle = firstParts[1] ?? ''; // first middle name only; any second middle is ignored
    last = p.lastname;
  } else {
    const raw = p?.display_name ?? p?.common_name ?? p?.name ?? entry.player_name ?? '';
    const parts = raw.trim().split(/\s+/);
    first = parts[0] ?? '';
    last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
    middle = parts.length > 2 ? (parts[1] ?? '') : ''; // first middle only
  }

  const initial = (w: string) => (w[0] ?? '').toUpperCase() + '.';

  // 1. First + Middle
  if (middle) {
    const s = `${first} ${middle}`;
    if (s.length <= 13) return s;
  }

  // 2. First + Last
  if (last) {
    const s = `${first} ${last}`;
    if (s.length <= 13) return s;
  }

  // 3. First + initials
  const initials = [middle && initial(middle), last && initial(last)].filter(Boolean).join(' ');
  return initials ? `${first} ${initials}` : first;
}

export function getPlayerFamilyName(
  player: { name?: string; display_name?: string; lastname?: string; common_name?: string } | null | undefined
): string {
  if (!player) return '';
  if (player.lastname) return player.lastname;
  const src = player.display_name ?? player.common_name ?? player.name ?? '';
  const parts = src.trim().split(' ');
  return parts[parts.length - 1] ?? src;
}

export function getDetailValue(
  details: import('../api/types').LineupDetail[] | undefined,
  typeName: string
): string | number | null {
  if (!details?.length) return null;
  const d = details.find(x => x.type?.name?.toLowerCase() === typeName.toLowerCase());
  return d?.value ?? null;
}

export function getRatingColor(
  rating: number | null | undefined,
  colors: { win: string; gold: string; textMuted: string }
): string {
  if (rating == null) return colors.textMuted;
  if (rating >= 7.5) return colors.win;
  if (rating >= 6.5) return colors.gold;
  return colors.textMuted;
}
