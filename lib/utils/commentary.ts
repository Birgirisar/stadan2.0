import type { CommentaryEntry } from '../api/types';

export interface PeriodMarkerResult {
  kind: 'KO' | 'HT' | 'FT_2H_START' | 'FT' | 'ET' | null;
  label: string | null;
}

/**
 * Parse a scoreline like "0-2" from a comment and return it with an en-dash.
 * e.g. "a score of 1-2" → "1–2"
 */
function extractScore(comment: string): string | null {
  const m = comment.match(/(\d+)-(\d+)/);
  if (!m) return null;
  return `${m[1]}–${m[2]}`;
}

/**
 * Detect whether a Sportmonks English commentary entry is a period-boundary marker.
 * Returns the Icelandic label (with score appended where available) or null.
 *
 * Match text patterns verified against real API data (fixture 19656263):
 *   "The first half ends with a score of 0-0."
 *   "The match ends with a score of 0-2."
 */
export function detectPeriodMarker(comment: string): PeriodMarkerResult {
  const lower = comment.toLowerCase();

  if (/(kick.?off|first half begins|match begins)/.test(lower)) {
    return { kind: 'KO', label: 'Leikur hefst' };
  }

  if (/first half ends/.test(lower)) {
    const score = extractScore(comment);
    return { kind: 'HT', label: score ? `Hálfleikur · ${score}` : 'Hálfleikur' };
  }

  if (/(second half begins|second half starts)/.test(lower)) {
    return { kind: 'FT_2H_START', label: 'Síðari hálfleikur hefst' };
  }

  if (/(full.?time|match ends|the match has ended)/.test(lower)) {
    const score = extractScore(comment);
    return { kind: 'FT', label: score ? `Leik lokið · ${score}` : 'Leik lokið' };
  }

  if (/(extra.?time|et begins)/.test(lower)) {
    return { kind: 'ET', label: 'Framlenging' };
  }

  return { kind: null, label: null };
}

// ── Deduplication ─────────────────────────────────────────────────────────────

/**
 * Returns true if the comment text describes a scoring action.
 * Used to identify redundant goal echoes that should be dropped when a canonical
 * `is_goal: true` entry already exists for the same minute.
 */
function looksLikeScoringAction(comment: string): boolean {
  const lower = comment.toLowerCase();
  return (
    /\bscores\b/.test(lower) ||
    /results in a goal/.test(lower) ||
    /scores a goal/.test(lower)
  );
}

/**
 * Remove duplicate and redundant commentary entries produced by Sportmonks.
 *
 * Two passes:
 *
 * Pass 1 — Exact text dedup (case-insensitive, trimmed).
 * Sportmonks sometimes emits the identical sentence 2-4× with different `id`
 * and `order` values (e.g. "Amin Cosic takes a left-footed shot but misses."
 * appearing at minutes 70, 70, 76, 76, 76). We keep the earliest occurrence
 * by `order` and discard the rest.
 *
 * Pass 2 — Same-minute goal echo removal.
 * For each minute that contains at least one `is_goal: true` entry (the
 * canonical "Goal! X scores…" description), Sportmonks also emits 1-3 extra
 * entries at the same minute that describe the same goal differently:
 *   "Ludviksson Anton scores with a left-footed shot."
 *   "Shot by Karason with his right foot results in a goal."
 * We keep the `is_goal: true` entry and any entry at that minute that does NOT
 * describe a scoring action (legitimate co-events: a sub, a card, etc.).
 * We drop the redundant scoring-action entries.
 *
 * Entries with minute: null (period markers) are never touched by pass 2.
 */
export function deduplicateCommentary(entries: CommentaryEntry[]): CommentaryEntry[] {
  // ── Pass 1: exact text dedup ──────────────────────────────────────────────
  const byOrder = [...entries].sort((a, b) => a.order - b.order);
  const seenText = new Set<string>();
  const afterPass1: CommentaryEntry[] = [];

  for (const entry of byOrder) {
    const key = entry.comment.trim().toLowerCase();
    if (!seenText.has(key)) {
      seenText.add(key);
      afterPass1.push(entry);
    }
  }

  // ── Pass 2: same-minute goal echo removal ─────────────────────────────────
  // Group non-null minutes; period markers pass through untouched.
  const nullMinute: CommentaryEntry[] = [];
  const byMinute = new Map<number, CommentaryEntry[]>();

  for (const entry of afterPass1) {
    if (entry.minute === null) {
      nullMinute.push(entry);
    } else {
      if (!byMinute.has(entry.minute)) byMinute.set(entry.minute, []);
      byMinute.get(entry.minute)!.push(entry);
    }
  }

  const afterPass2: CommentaryEntry[] = [...nullMinute];

  for (const group of byMinute.values()) {
    if (group.length === 1) {
      afterPass2.push(group[0]);
      continue;
    }

    const hasOfficialGoal = group.some((e) => e.is_goal);

    if (!hasOfficialGoal) {
      // No canonical goal entry — keep everything (different legitimate events,
      // or contradictory data we can't resolve).
      afterPass2.push(...group);
    } else {
      // Keep: the is_goal:true entry + any entry that is NOT a scoring echo.
      // Drop: entries that look like a scoring action but aren't the canonical one.
      for (const entry of group) {
        if (entry.is_goal || !looksLikeScoringAction(entry.comment)) {
          afterPass2.push(entry);
        }
      }
    }
  }

  return afterPass2;
}

// ── Sort key ──────────────────────────────────────────────────────────────────

/**
 * Returns an effective minute value for sorting commentary entries newest-first.
 *
 * Regular entries: actual minute + extra_minute/1000 as a fractional value
 * (45+2 → 45.002, always below the HT synthetic at 45.5).
 *
 * Period markers get synthetic minutes so they land in the right position:
 *   FT          → 999   (always at the very top of a newest-first feed)
 *   ET          → 90.5  (above regular 90th-minute events)
 *   FT_2H_START → 45.6  (above HT, below 46th-minute events)
 *   HT          → 45.5  (above all 45+n events, below 46th-minute events)
 *   KO          → -1    (at the very bottom)
 *   unknown     → 0     (near the bottom; shouldn't happen in practice)
 */
export function getSortMinute(entry: CommentaryEntry): number {
  if (entry.minute !== null) {
    return entry.minute + (entry.extra_minute ?? 0) / 1000;
  }
  const { kind } = detectPeriodMarker(entry.comment);
  switch (kind) {
    case 'FT':          return 999;
    case 'ET':          return 90.5;
    case 'FT_2H_START': return 45.6;
    case 'HT':          return 45.5;
    case 'KO':          return -1;
    default:            return 0;
  }
}
