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

The floating bottom dock (`BottomDock`) is rendered at the **root layout level** (`app/_layout.tsx`) as an absolute-positioned overlay. This means it appears on every screen — tabs, match detail, and team detail — without any extra work.

Stack screens outside the `(tabs)` group:
- `app/match/[id].tsx` — Match detail, navigated from any fixture row
- `app/team/[id].tsx` — **Team detail**, navigated from match row crests, hero team names/crests, standings rows, and mini-league table rows

## Project structure

```
app/
  _layout.tsx           Root layout — fonts, QueryClient, ThemeProvider, global BottomDock
  (tabs)/
    _layout.tsx         Tab group
    index.tsx           Leikir screen (main fixture list)
    mot/                Mót directory + league detail
    frettir.tsx         Fréttir placeholder
  match/
    [id].tsx            Match detail screen
  team/
    [id].tsx            Team detail screen (NEW)

components/
  fixtures/             DaySelector, FilterChips, LeagueSection, MatchRow, TeamBadge
  match-detail/         HeroCollapsing, SubTabs, ScorersList, EventRow, EventTimeline,
                        ManOfTheMatchCard, RecentForm, MiniLeagueTable, PlaceholderTab,
                        lineup/, commentary/, TaflaTab
  league-detail/        StandingsTable, StandingsRow (tappable → team detail), ...
  team-detail/          (NEW) SubTabs, TeamHeader, NextMatchCard, LastMatchCard,
                        RecentFormGrid, MiniPositionCard, TopScorersList,
                        SeasonStatsGrid, StadiumCard
  ui/                   BottomDock (custom floating tab bar)

lib/
  api/                  sportmonks.ts, fixtures.ts, matchDetail.ts, teamForm.ts,
                        standings.ts, teamDetail.ts (NEW), types.ts
  hooks/                useMatchDetail.ts, useTeamForm.ts, useStandings.ts,
                        useTeamDetail.ts (NEW), useFollowedLeagues.ts,
                        useFollowedTeams.ts (NEW)
  theme/                colors.ts, ThemeProvider.tsx, useTheme.ts
  utils/                dates.ts, score.ts, state.ts, events.ts, form.ts,
                        venueDisplay.ts (NEW)

constants/
  leagues.ts            The 5 target leagues with sort order
```

## Team detail — navigation entry points

Any of these surfaces navigate to `/team/{id}`:
1. **MatchRow crest** — tap the home or away team's crest badge (rest of the row still goes to match detail)
2. **Match detail hero** — tap a team crest (48px) or team name in the collapsing hero
3. **League detail standings rows** — tap any row in `StandingsTable` (via `StandingsRow`)
4. **Match detail mini-league table** — tap any row in `MiniLeagueTable`

## Team detail — Sportmonks endpoints & quirks

| Endpoint | Used for |
|---|---|
| `GET /teams/{id}?include=venue;coaches.coach;country` | Team info, venue, current coach |
| `GET /schedules/teams/{id}` | All fixtures with scores + participants embedded (no extra includes needed). Used to derive seasonId, next match, last match, and form. |
| `GET /standings/seasons/{seasonId}?include=participant;details` | Full standings for mini-position and season stats |
| `GET /topscorers/seasons/{seasonId}?include=player;participant` | League-wide top scorers; filtered client-side to `participant_id === teamId` |

**Quirks discovered:**
- `GET /teams/{id}?include=currentSeason` → **does not exist** on the Team entity. Season is derived from the schedule endpoint instead.
- `schedule.rounds[].fixtures[]` already includes `participants` and `scores` — no extra `include` needed on `/schedules/teams/{id}`.
- `short_code` is **null** for most Icelandic clubs — `TeamBadge` falls back to the first 3 chars of the name.
- Top scorer entries use `total` (not `total_goals`) for goal count. No `jersey_number` on the topscorer entry.
- `venue.surface` returns `"grass"` (lowercase). Translated to `"Gras"` via `venueDisplay.ts`.
- Teams not in our 5 leagues (e.g. cup opponents) still get a team detail screen — the mini-position, top scorers, and season stats sections are hidden; only the header, match cards, form, and venue are shown.

## Match detail — Sportmonks quirks

- **standings**: `/standings/seasons/{seasonId}` returns an array of stage objects. Each stage has `standings.data` (an array of team rows). The parser in `lib/api/standings.ts` flattens all stages. If the competition has no standings (cup/friendly), the array is empty and `MiniLeagueTable` hides itself.
- **events include**: Use `events.relatedPlayer` (camelCase) in the `include` param; the response field is `related_player` (snake_case).
- **MOTM**: Icelandic league fixtures do not consistently have `meta.man_of_the_match`. The fallback uses the highest `rating` value across all lineup entries. If no ratings exist, the `ManOfTheMatchCard` is hidden entirely.
- **team form**: Uses `/schedules/seasons/{seasonId}/teams/{teamId}` — filters to finished rounds and takes the 5 most recent fixtures.

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
