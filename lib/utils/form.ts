import type { Fixture, Participant } from '../api/types';
import { getScore } from './score';

export type FormResult = 'W' | 'D' | 'L';

export interface FormEntry {
  fixtureId: number;
  result: FormResult;
  homeGoals: number;
  awayGoals: number;
  homeTeam: Participant;
  awayTeam: Participant;
  isTargetHome: boolean;
}

const EMPTY_PARTICIPANT: Participant = {
  id: 0,
  name: '?',
  short_code: '?',
  image_path: '',
  meta: { location: 'home', winner: null },
};

export function computeForm(fixtures: Fixture[], teamId: number): FormEntry[] {
  return fixtures.map((fixture) => {
    const home = fixture.participants?.find((p) => p.meta.location === 'home') ?? EMPTY_PARTICIPANT;
    const away = fixture.participants?.find((p) => p.meta.location === 'away') ?? EMPTY_PARTICIPANT;
    const score = getScore(fixture);
    const hg = score.home ?? 0;
    const ag = score.away ?? 0;
    const isTargetHome = home.id === teamId;

    let result: FormResult;
    if (hg === ag) {
      result = 'D';
    } else if (isTargetHome ? hg > ag : ag > hg) {
      result = 'W';
    } else {
      result = 'L';
    }

    return { fixtureId: fixture.id, result, homeGoals: hg, awayGoals: ag, homeTeam: home, awayTeam: away, isTargetHome };
  });
}
