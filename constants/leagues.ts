export const LEAGUES = {
  345: { sortOrder: 1, displayName: 'Besta deild karla' },
  348: { sortOrder: 3, displayName: 'Lengjudeild karla' },
  351: { sortOrder: 5, displayName: '2. deild karla' },
  1710: { sortOrder: 2, displayName: 'Besta deild kvenna' },
  1711: { sortOrder: 4, displayName: 'Lengjudeild kvenna' },
} as const;

export type LeagueId = keyof typeof LEAGUES;
