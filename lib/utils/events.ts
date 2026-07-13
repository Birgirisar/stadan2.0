import type { FixtureEvent } from '../api/types';
import { getEventRelatedPlayerName } from './playerName';

export const EVENT_TYPE = {
  GOAL: 14,
  OWN_GOAL: 15,
  PENALTY: 16,
  MISSED_PENALTY: 17,
  SUBSTITUTION: 18,
  YELLOW_CARD: 19,
  RED_CARD: 20,
  YELLOW_RED: 21,
} as const;

const DISPLAY_TYPES = new Set<number>(Object.values(EVENT_TYPE));

export type TimelineItem =
  | { kind: 'event'; event: FixtureEvent; side: 'home' | 'away' }
  | { kind: 'divider'; label: string };

function eventMinute(e: FixtureEvent): number {
  return e.minute + (e.extra_minute ?? 0);
}

export function formatMinute(e: FixtureEvent): string {
  if (e.extra_minute) return `${e.minute}+${e.extra_minute}'`;
  return `${e.minute}'`;
}

export function buildTimeline(
  events: FixtureEvent[],
  homeTeamId: number,
  finalHomeGoals: number | null,
  finalAwayGoals: number | null,
  isFinished: boolean,
): TimelineItem[] {
  const filtered = events
    .filter((e) => DISPLAY_TYPES.has(e.type_id))
    .sort((a, b) => eventMinute(a) - eventMinute(b));

  const items: TimelineItem[] = [];
  let htInserted = false;
  let runHome = 0;
  let runAway = 0;

  for (const event of filtered) {
    const min = eventMinute(event);
    const side: 'home' | 'away' = event.participant_id === homeTeamId ? 'home' : 'away';

    if (!htInserted && min > 45) {
      items.push({ kind: 'divider', label: `Hálfleikur · ${runHome}–${runAway}` });
      htInserted = true;
    }

    // Accumulate score to track running total for divider labels
    if (event.type_id === EVENT_TYPE.GOAL || event.type_id === EVENT_TYPE.PENALTY) {
      if (side === 'home') runHome++;
      else runAway++;
    } else if (event.type_id === EVENT_TYPE.OWN_GOAL) {
      if (side === 'home') runAway++;
      else runHome++;
    }

    items.push({ kind: 'event', event, side });
  }

  if (isFinished) {
    items.push({
      kind: 'divider',
      label: `Leik lokið · ${finalHomeGoals ?? 0}–${finalAwayGoals ?? 0}`,
    });
  }

  return items;
}

export function getEventLabel(event: FixtureEvent): { line1Sub: string; iconType: string } {
  switch (event.type_id) {
    case EVENT_TYPE.GOAL: {
      const assist = getEventRelatedPlayerName(event);
      return {
        line1Sub: assist ? `${assist}` : '',
        iconType: 'goal',
      };
    }
    case EVENT_TYPE.PENALTY:
      return { line1Sub: 'Vítaspyrna', iconType: 'pen-goal' };
    case EVENT_TYPE.OWN_GOAL:
      return { line1Sub: 'Sjálfsmark', iconType: 'own-goal' };
    case EVENT_TYPE.MISSED_PENALTY:
      return { line1Sub: 'Víta klúður', iconType: 'missed-pen' };
    case EVENT_TYPE.YELLOW_CARD:
      return { line1Sub: 'Gult spjald', iconType: 'yellow' };
    case EVENT_TYPE.RED_CARD:
      return { line1Sub: 'Rautt spjald', iconType: 'red' };
    case EVENT_TYPE.YELLOW_RED:
      return { line1Sub: 'Seinna gula spjaldið', iconType: 'yellow-red' };
    case EVENT_TYPE.SUBSTITUTION:
      return { line1Sub: '', iconType: 'sub' };
    default:
      return { line1Sub: '', iconType: 'goal' };
  }
}
