// Primary kit color per team ID — used for H2H badge tints and any team-branded UI.
// Falls back to null when the team isn't listed; callers should handle the null case.
const TEAM_COLORS: Record<number, string> = {
  // Besta deild karla
  2929:  '#C8102E', // Valur        — red
  8673:  '#1B1B1B', // KR           — black
  5856:  '#003DA5', // Fram         — royal blue
  6913:  '#1B4FA8', // Breiðablik   — blue
  2688:  '#8B0000', // Víkingur     — dark red
  1268:  '#005BAC', // ÍA           — blue
  10419: '#1B1B1B', // Keflavík     — black & red → black
  7325:  '#B80000', // KA Akureyri  — red
  8680:  '#236B2E', // Stjarnan     — green
  8828:  '#0A3B7F', // Þór          — blue
  853:   '#00539B', // ÍBV          — blue
  10420: '#003899', // FH           — blue

  // 1. deild karla
  3830:  '#D11920', // Fylkir       — red
  10443: '#D4A017', // Afturelding  — amber
  178:   '#CC0000', // HK           — red
  10436: '#C41E3A', // Grótta       — red
  1654:  '#0047AB', // Þróttur      — blue
  8503:  '#D4A017', // Vestri       — yellow
  9499:  '#E85C00', // Leiknir Rvk  — orange
  10423: '#CC0000', // Njardvík     — red
  7708:  '#CC0000', // Grindavík    — red
  10428: '#CC0000', // ÍR           — red
  10521: '#005BAC', // Ægir         — blue
  10206: '#1B1B1B', // Völsungur    — black
};

export function getTeamPrimaryColor(teamId: number): string | null {
  return TEAM_COLORS[teamId] ?? null;
}
