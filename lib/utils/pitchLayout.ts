import type { LineupEntry } from '../api/types';

// Derives a formation string like "4-3-3" from the actual starter positions.
// Used as fallback when fixture.formations is empty (e.g. lower-tier leagues).
export function deriveFormation(starters: LineupEntry[]): string {
  const rowCounts = new Map<number, number>();
  for (const entry of starters) {
    if (!entry.formation_field) continue;
    const { row } = parseFormationField(entry.formation_field);
    rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
  }
  if (rowCounts.size === 0) return '';
  return Array.from(rowCounts.entries())
    .sort((a, b) => a[0] - b[0])
    .filter(([row]) => row > 1)
    .map(([, count]) => count)
    .join('-');
}

export function parseFormationField(formationField: string): { row: number; col: number } {
  const parts = formationField.split(':');
  return {
    row: parseInt(parts[0] ?? '1', 10),
    col: parseInt(parts[1] ?? '1', 10),
  };
}

// Returns each formation row as its own array, ordered for display:
//   Home (isAway=false): GK first (top of pitch), attackers last (near midline)
//   Away (isAway=true):  attackers first (near midline), GK last (bottom of pitch)
// Players within each row are sorted left→right by formation column.
export function organizeStartersIntoRows(
  starters: LineupEntry[],
  isAway: boolean
): LineupEntry[][] {
  const formationRowMap = new Map<number, LineupEntry[]>();
  for (const entry of starters) {
    const row = entry.formation_field ? parseFormationField(entry.formation_field).row : 1;
    if (!formationRowMap.has(row)) formationRowMap.set(row, []);
    formationRowMap.get(row)!.push(entry);
  }

  for (const players of formationRowMap.values()) {
    players.sort((a, b) => {
      const colA = a.formation_field ? parseFormationField(a.formation_field).col : 0;
      const colB = b.formation_field ? parseFormationField(b.formation_field).col : 0;
      return colA - colB;
    });
  }

  const sorted = Array.from(formationRowMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, players]) => players);

  return isAway ? [...sorted].reverse() : sorted;
}
