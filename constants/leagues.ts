export const LEAGUES = {
  345: { sortOrder: 1, displayName: 'Besta deild karla' },
  348: { sortOrder: 2, displayName: 'Lengjudeild karla' },
  351: { sortOrder: 3, displayName: '2. deild karla' },
  1710: { sortOrder: 4, displayName: 'Besta deild kvenna' },
  1711: { sortOrder: 5, displayName: 'Lengjudeild kvenna' },
} as const;

export type LeagueId = keyof typeof LEAGUES;
