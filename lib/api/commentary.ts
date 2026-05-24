import { smGet } from './sportmonks';
import type { CommentaryEntry } from './types';

export async function fetchCommentary(fixtureId: string | number): Promise<CommentaryEntry[]> {
  // Sportmonks returns { message: "No result(s) found..." } with no `data` field
  // for fixtures that have no commentary — smGet gives us undefined in that case.
  const result = await smGet<CommentaryEntry[] | undefined>(
    `/commentaries/fixtures/${fixtureId}`,
  );
  return result ?? [];
}
