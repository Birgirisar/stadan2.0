import type { RoundFull } from '../api/types';

// Icelandic month abbreviations — matches the pattern already used in dates.ts
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maí', 'jún', 'júl', 'ágú', 'sep', 'okt', 'nóv', 'des'];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Determine which round to show by default when opening the Leikir tab.
 *
 * Priority:
 * 1. A round that is in progress right now (not finished, starting_at ≤ now ≤ ending_at)
 * 2. Season finished (all rounds done) → last round
 * 3. Season not started (no round has started yet) → first round
 * 4. Between rounds (a Monday after Saturday's games) → most recently finished round
 *
 * Returns null only if the rounds array is empty.
 */
export function pickDefaultRound(rounds: RoundFull[]): number | null {
  if (!rounds.length) return null;

  // Work with a copy sorted by round number (id as tiebreak)
  const sorted = [...rounds].sort((a, b) => {
    const ai = parseInt(a.name ?? '', 10);
    const bi = parseInt(b.name ?? '', 10);
    if (!isNaN(ai) && !isNaN(bi)) return ai - bi;
    return a.id - b.id;
  });

  const now = new Date();

  // 1. Round currently in progress — not finished AND now falls within its window
  const current = sorted.find((r) => {
    if (r.finished) return false;
    const start = r.starting_at ? new Date(r.starting_at) : null;
    const end = r.ending_at ? new Date(r.ending_at) : null;
    if (!start || !end) return false;
    return now >= start && now <= end;
  });
  if (current) return current.id;

  // 2. All rounds finished → season is over, show last round
  if (sorted.every((r) => r.finished)) {
    return sorted[sorted.length - 1].id;
  }

  // 3. No round has started yet → season upcoming, show first round
  const anyStarted = sorted.some(
    (r) => r.starting_at && new Date(r.starting_at) <= now
  );
  if (!anyStarted) return sorted[0].id;

  // 4. Between rounds — show the most recently finished round (catch-up view)
  const finished = sorted.filter((r) => r.finished);
  if (finished.length > 0) return finished[finished.length - 1].id;

  // Fallback: first round
  return sorted[0].id;
}

/**
 * Formats a round's date range as an Icelandic label.
 *
 * Examples:
 *   Single day:      "Umferð 4 · 10. maí"
 *   Same month:      "Umferð 4 · 10.–12. maí"
 *   Cross-month:     "Umferð 4 · 30. apr–2. maí"
 */
export function formatRoundDateRange(round: RoundFull): string {
  const n = round.name ?? String(round.id);

  if (!round.starting_at) return `Umferð ${n}`;

  const start = new Date(round.starting_at);
  const end = round.ending_at ? new Date(round.ending_at) : null;

  const sd = start.getDate();
  const sm = start.getMonth();

  if (!end || isSameDay(start, end)) {
    return `Umferð ${n} · ${sd}. ${MONTHS[sm]}`;
  }

  const ed = end.getDate();
  const em = end.getMonth();

  if (sm === em) {
    return `Umferð ${n} · ${sd}.–${ed}. ${MONTHS[sm]}`;
  }

  return `Umferð ${n} · ${sd}. ${MONTHS[sm]}–${ed}. ${MONTHS[em]}`;
}
