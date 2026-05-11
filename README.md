# Staðan — Íslenskur fótbolti

Livescore app for Icelandic football. Built with Expo (managed workflow), Expo Router, and React Query.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API token**

   The project reads `EXPO_PUBLIC_SPORTMONKS_KEY` from a `.env` file (or `.env.local`).
   Your `.env.local` already contains the real token. Rename it to `.env` or copy the value:

   ```bash
   cp .env.local .env
   ```

   > `.env` and `.env.local` are in `.gitignore` — never commit the real token.

3. **Start the dev server**
   ```bash
   npx expo start
   ```

4. **Open in Expo Go**
   - Scan the QR code with the Expo Go app on your phone.
   - Make sure your phone and computer are on the same Wi-Fi network.

## Project structure

```
app/
  _layout.tsx           Root layout — fonts, QueryClient, ThemeProvider
  (tabs)/
    _layout.tsx         Tab navigator (custom floating dock)
    index.tsx           Leikir screen (main fixture list)
    mot.tsx             Mót placeholder
    frettir.tsx         Fréttir placeholder

components/
  fixtures/             DaySelector, FilterChips, LeagueSection, MatchRow, TeamBadge
  ui/                   BottomDock (custom floating tab bar)

lib/
  api/                  sportmonks.ts (Axios client), fixtures.ts (React Query hook), types.ts
  theme/                colors.ts, ThemeProvider.tsx, useTheme.ts
  utils/                dates.ts (Icelandic), score.ts, state.ts

constants/
  leagues.ts            The 5 target leagues with sort order
```

## Data source

Sportmonks v3 Football API. Only fixtures from these 5 leagues are fetched:

| ID   | Name                   |
|------|------------------------|
| 345  | Besta deild karla      |
| 348  | Lengjudeild karla      |
| 351  | 2. deild karla         |
| 1710 | Besta deild kvenna     |
| 1711 | Lengjudeild kvenna     |

The fixture list auto-refreshes every 30 seconds when any match is live.
