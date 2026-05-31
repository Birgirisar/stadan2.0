import { getScore } from './score';
import { getMatchState } from './state';
import type { Fixture } from '../api/types';

export interface H2HSummary {
  homeWins: number;
  awayWins: number;
  draws: number;
  totalMatches: number;
}

export function calculateH2HSummary(
  meetings: Fixture[],
  todaysHomeTeamId: number,
  todaysAwayTeamId: number,
): H2HSummary {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;

  for (const match of meetings) {
    const stateResult = getMatchState(match.state);
    if (stateResult.type !== 'finished') continue;

    const homeParticipant = match.participants?.find((p) => p.meta.location === 'home');
    const awayParticipant = match.participants?.find((p) => p.meta.location === 'away');
    if (!homeParticipant || !awayParticipant) continue;

    const score = getScore(match);
    if (score.home == null || score.away == null) continue;

    if (score.home > score.away) {
      // That match's home team won
      if (homeParticipant.id === todaysHomeTeamId) homeWins++;
      else if (homeParticipant.id === todaysAwayTeamId) awayWins++;
    } else if (score.away > score.home) {
      // That match's away team won
      if (awayParticipant.id === todaysHomeTeamId) homeWins++;
      else if (awayParticipant.id === todaysAwayTeamId) awayWins++;
    } else {
      draws++;
    }
  }

  return { homeWins, awayWins, draws, totalMatches: homeWins + awayWins + draws };
}
