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

## Routing approach: global BottomDock (Option A)

The floating bottom dock (`BottomDock`) is rendered at the **root layout level** (`app/_layout.tsx`) as an absolute-positioned overlay. This means it appears on every screen — both the tab screens and the match detail screen — without any extra work.

The match detail lives at `app/match/[id].tsx`, a standard Stack route outside the `(tabs)` group. Tapping any fixture in the Leikir list navigates here. The back arrow returns to the previous screen via `router.back()`.

## Project structure

```
app/
  _layout.tsx           Root layout — fonts, QueryClient, ThemeProvider, global BottomDock
  (tabs)/
    _layout.tsx         Tab group (dock removed; handled by root)
    index.tsx           Leikir screen (main fixture list)
    mot.tsx             Mót placeholder
    frettir.tsx         Fréttir placeholder
  match/
    [id].tsx            Match detail screen (Yfirlit + placeholder sub-tabs)

components/
  fixtures/             DaySelector, FilterChips, LeagueSection, MatchRow, TeamBadge
  match-detail/         HeroCollapsing, SubTabs, ScorersList, EventRow, EventTimeline,
                        ManOfTheMatchCard, RecentForm, MiniLeagueTable, PlaceholderTab
  ui/                   BottomDock (custom floating tab bar)

lib/
  api/                  sportmonks.ts, fixtures.ts, matchDetail.ts, teamForm.ts, standings.ts, types.ts
  hooks/                useMatchDetail.ts, useTeamForm.ts, useStandings.ts
  theme/                colors.ts (+ win/draw/loss), ThemeProvider.tsx, useTheme.ts
  utils/                dates.ts, score.ts, state.ts, events.ts, form.ts

constants/
  leagues.ts            The 5 target leagues with sort order
```

## Match detail — Sportmonks quirks

- **standings**: `/standings/season/{seasonId}` returns an array of stage objects. Each stage has `standings.data` (an array of team rows). The parser in `lib/api/standings.ts` flattens all stages. If the competition has no standings (cup/friendly), the array is empty and `MiniLeagueTable` hides itself.
- **events include**: Use `events.relatedPlayer` (camelCase) in the `include` param; the response field is `related_player` (snake_case).
- **MOTM**: Icelandic league fixtures do not consistently have `meta.man_of_the_match`. The fallback uses the highest `rating` value across all lineup entries. If no ratings exist, the `ManOfTheMatchCard` is hidden entirely.
- **team form**: `fixtureStates:5` filters to finished matches (state id 5 = FT). The `/fixtures/between` endpoint returns up to 10 results; we take the 5 most recent.

## Animation

The hero collapse uses `Animated.ScrollView` with `useNativeDriver: false` (required because `height` is animated). All interpolations run on the JS thread. On Hermes + modern devices this stays at 60 fps. If jank appears, the fix is to switch to a `scaleY` + `translateY` approach on a fixed-height container so native driver can be used.

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
