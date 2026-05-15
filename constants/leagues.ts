export const LEAGUES = {
  345: { sortOrder: 1, displayName: 'Besta deild karla', isWomens: false },
  348: { sortOrder: 3, displayName: 'Lengjudeild karla', isWomens: false },
  351: { sortOrder: 5, displayName: '2. deild karla', isWomens: false },
  1710: { sortOrder: 2, displayName: 'Besta deild kvenna', isWomens: true },
  1711: { sortOrder: 4, displayName: 'Lengjudeild kvenna', isWomens: true },
} as const;

// Order for the Mót directory listing (spec-defined)
export const DIRECTORY_LEAGUE_IDS = [345, 1710, 348, 1711, 351] as const;

// Hardcoded zone rules for Icelandic leagues as fallback when API returns no rule data
export const ZONE_RULES: Record<number, Record<number, 'promotion' | 'relegation'>> = {
  345: { 1: 'promotion', 2: 'promotion', 3: 'promotion', 11: 'relegation', 12: 'relegation' },
  348: { 1: 'promotion', 2: 'promotion', 15: 'relegation', 16: 'relegation' },
  1710: { 1: 'promotion', 2: 'promotion', 3: 'promotion', 10: 'relegation', 11: 'relegation' },
};

export type LeagueId = keyof typeof LEAGUES;
