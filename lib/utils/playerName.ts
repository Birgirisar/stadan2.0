import type { FixtureEvent } from '../api/types';

export function formatPlayerName(name: string, mode: 'full' | 'compact'): string {
  if (mode === 'full') return name;

  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name;

  const last = parts[parts.length - 1];
  const abbrevs = parts.slice(0, -1).map((p) => p[0] + '.');
  return [...abbrevs, last].join(' ');
}

/**
 * Sportmonks' flat `player_name` field on fixture events is often already
 * abbreviated at the source (e.g. "H. Guðjónsson"), while the included
 * `player` relation usually carries the full name ("Helgi Guðjónsson").
 * Prefer the relation and only fall back to the flat field when it's missing.
 */
export function getEventPlayerName(event: FixtureEvent): string | null {
  return event.player?.name || event.player_name || null;
}

export function getEventRelatedPlayerName(event: FixtureEvent): string | null {
  return event.related_player?.name || event.related_player_name || null;
}
