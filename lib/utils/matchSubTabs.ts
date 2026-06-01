import { getMatchState } from './state';
import type { DetailedFixture } from '../api/types';

// The 5 Icelandic leagues that have standings
export const STANDINGS_LEAGUE_IDS = new Set([345, 348, 351, 1710, 1711]);

export type SubTabId =
  | 'yfirlit'
  | 'lysing'
  | 'lidin'
  | 'tafla'
  | 'tolfraedi'
  | 'innbyrðis';

export interface SubTabDef {
  id: SubTabId;
  label: string;
}

/**
 * Returns the ordered list of sub-tabs to render for a given fixture.
 * Rules:
 *   Yfirlit    — always
 *   Lýsing     — always
 *   Liðin      — always
 *   Tafla      — only when league_id ∈ STANDINGS_LEAGUE_IDS
 *   Tölfræði   — only for live / finished matches
 *   Innbyrðis  — always
 */
export function getAvailableSubTabs(
  fixture: Pick<DetailedFixture, 'league_id' | 'state'>,
): SubTabDef[] {
  const stateResult = getMatchState(fixture.state);
  const isLiveOrFinished =
    stateResult.type === 'live' ||
    stateResult.type === 'halftime' ||
    stateResult.type === 'finished';

  const hasStandings = STANDINGS_LEAGUE_IDS.has(fixture.league_id);

  const tabs: SubTabDef[] = [
    { id: 'yfirlit', label: 'Yfirlit' },
    { id: 'lidin', label: 'Liðin' },
  ];

  if (hasStandings) {
    tabs.push({ id: 'tafla', label: 'Tafla' });
  }

  tabs.push({ id: 'innbyrðis', label: 'Innbyrðis' });

  if (isLiveOrFinished) {
    tabs.push({ id: 'tolfraedi', label: 'Tölfræði' });
  }

  return tabs;
}
