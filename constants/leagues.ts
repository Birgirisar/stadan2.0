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
export const ZONE_RULES: Record<number, Record<number, 'promotion' | 'playoff' | 'relegation'>> = {
  // Split-phase leagues: "promotion" = goes to Efri hluti, "playoff" = goes to Neðri hluti
  345: { 1: 'promotion', 2: 'promotion', 3: 'promotion', 4: 'promotion', 5: 'promotion', 6: 'promotion', 7: 'playoff', 8: 'playoff', 9: 'playoff', 10: 'playoff', 11: 'playoff', 12: 'playoff' },
  1710: { 1: 'promotion', 2: 'promotion', 3: 'promotion', 4: 'promotion', 5: 'promotion', 6: 'promotion', 7: 'playoff', 8: 'playoff', 9: 'playoff', 10: 'playoff' },
  348: { 1: 'promotion', 2: 'playoff', 3: 'playoff', 4: 'playoff', 5: 'playoff', 11: 'relegation', 12: 'relegation' },
  1711: { 1: 'promotion', 2: 'promotion', 9: 'relegation', 10: 'relegation' },
  351: { 1: 'promotion', 2: 'promotion', 11: 'relegation', 12: 'relegation' },
};

type ZoneType = 'promotion' | 'playoff' | 'relegation';
type ZoneRuleMap = Record<number, ZoneType>;

// Zone rules for the championship playoff group (Efri hluti) per league
export const EFRI_HLUTI_ZONE_RULES: Record<number, ZoneRuleMap> = {
  // Men: 1st = Champions League, 2nd–3rd = Conference League
  345: { 1: 'promotion', 2: 'playoff', 3: 'playoff' },
  // Women: 1st = European competition, 2nd = Europa Cup
  1710: { 1: 'promotion', 2: 'playoff' },
};

// Zone rules for the relegation playoff group (Neðri hluti) per league
export const NEDRI_HLUTI_ZONE_RULES: Record<number, ZoneRuleMap> = {
  // Men: 5th & 6th relegated (= 11th & 12th overall)
  345: { 5: 'relegation', 6: 'relegation' },
  // Women: 3rd & 4th relegated (= 9th & 10th overall, 4-team group)
  1710: { 3: 'relegation', 4: 'relegation' },
};

export type ZoneLabels = { promotion?: string; playoff?: string; relegation?: string };

// Zone legend labels for the championship playoff group per league
export const EFRI_HLUTI_ZONE_LABELS: Record<number, ZoneLabels> = {
  345: { promotion: 'Sæti í forkeppni Meistaradeildar', playoff: 'Sæti í forkeppni Sambandsdeildar' },
  1710: { promotion: 'Forkeppni Meistaradeildar', playoff: 'Forkeppni Evrópubikars' },
};

// Zone legend labels for the relegation playoff group per league
export const NEDRI_HLUTI_ZONE_LABELS: Record<number, ZoneLabels> = {
  345: { relegation: 'Fall í Lengjudeild' },
  1710: { relegation: 'Fall í Lengjudeild' },
};

export type LeagueId = keyof typeof LEAGUES;
