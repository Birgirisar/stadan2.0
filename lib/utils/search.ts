export function foldAccents(s: string): string {
  return s
    .replace(/[þÞ]/g, 'th')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[öÖ]/g, 'o')
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u')
    .replace(/[ýÝ]/g, 'y')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Returns null if no match; higher number = better match.
// Prefix match scores 1000+, substring match scores 100+.
export function scoreMatch(query: string, target: string): number | null {
  const q = foldAccents(query.toLowerCase());
  const t = foldAccents(target.toLowerCase());
  if (!q) return null;

  if (t.startsWith(q)) {
    return 1000 + Math.floor((q.length / t.length) * 100);
  }
  if (t.indexOf(q) >= 0) {
    return 100 + Math.floor((q.length / t.length) * 100);
  }
  return null;
}

export function filterAndRank<T extends { name: string }>(query: string, items: T[]): T[] {
  const q = query.trim();
  if (!q) return items;

  return items
    .map((item) => ({ item, score: scoreMatch(q, item.name) }))
    .filter((x): x is { item: T; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
