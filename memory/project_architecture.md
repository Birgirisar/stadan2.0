---
name: Staðan app architecture
description: Routing structure, component patterns, API quirks, animation approach for the Staðan app
type: project
---

## Routing structure

Root layout (`app/_layout.tsx`): `<Stack>` + `<BottomDock>` rendered outside the stack (always visible on all screens).

```
app/
  _layout.tsx          — Root Stack + BottomDock (always visible)
  (tabs)/
    _layout.tsx        — Tabs with tabBar={() => null} (custom BottomDock handles nav)
    index.tsx          — Leikir tab (fixtures by date)
    frettir.tsx        — Fréttir tab (placeholder)
    mot/
      _layout.tsx      — Stack navigator for Mót tab (slide_from_right)
      index.tsx        — League directory screen
      [leagueId].tsx   — League detail screen (standings, sub-tabs)
  match/
    [id].tsx           — Match detail (pushed on root stack)
```

## BottomDock active state
Uses `pathname.startsWith(href)` — so `/mot/345` correctly activates the Mót tab.

## Mót tab — data flow

**Directory screen** (`mot/index.tsx`):
- `useLeagueDirectory()` → fetches all 5 leagues in parallel with `useQueries`
- `useFollowedLeagues()` → AsyncStorage persistence under key `staðan:followed-leagues`
- `useFixturesByDate(today)` → live count per league via `getLiveCountByLeague()`

**Detail screen** (`mot/[leagueId].tsx`):
- `useLeagueMeta(leagueId)` → `GET /leagues/{id}?include=currentSeason;seasons`
- `useLeagueStandings(seasonId)` → `GET /standings/season/{id}?include=participant;form;details.type;rule`
- `useFixturesByDate(today)` → live team IDs via `getLiveTeamIds()`

## League IDs (Sportmonks)
- 345 → Besta deild karla (sortOrder 1)
- 348 → Lengjudeild karla (sortOrder 3)
- 351 → 2. deild karla (sortOrder 5)
- 1710 → Besta deild kvenna (sortOrder 2, isWomens)
- 1711 → Lengjudeild kvenna (sortOrder 4, isWomens)
- Directory order: [345, 348, 351, 1710, 1711]

## Sportmonks API quirks

### Standings response structure
The `/standings/seasons/{id}` endpoint returns an **array of stage objects**, each containing a `standings` field. The rows are nested as `standings.data[]` or `standings[]` (varies). Handled in `extractStandingRows()` in `lib/api/leagues.ts`.

Stats per row come via `details[]` array — each detail has a `type` object with `developer_name` like `OVERALL_WON`, `OVERALL_POINTS`, etc. Also sometimes returned directly as top-level numeric fields (`played`, `won`, `draw`, `lost`, `goal_difference`, `points`). Both are handled in `getStatRaw()`.

Form data is an array of `{ result: "W"/"D"/"L" }` objects (or sometimes a raw string).

### League endpoint
`GET /leagues/{id}?include=currentSeason;seasons` returns `currentSeason` (the active season object) and `seasons` (all historical seasons). `current_season_id` is on the league root object.

### Zone rules
The `rule` include on standings may not return data for Icelandic leagues. Hardcoded fallback in `constants/leagues.ts` (`ZONE_RULES`) for leagues 345, 348, 1710.

## Animation patterns

**Match detail**: `Animated.Value` driven by `Animated.event` on ScrollView (nativeDriver: true). Hero collapses from `heroFull` → `HERO_COLLAPSED` as scroll increases.

**League detail title reveal**: Same pattern. `scrollY` Animated.Value → `titleOpacity` + `titleTranslateY` interpolated over the last 60px of the league header scrolling away.

**ViewToggle**: Segmented control with spring-animated `Animated.Value` (0→1). Uses `onLayout` to measure half-width for pixel-accurate `translateX`.

## Theme system
`ThemeProvider` → `useTheme()` returns `{ theme, colors, toggleTheme }`. Colors include: bg, bgRgb, surface, surfaceElev, surfaceSunken, border, borderStrong, text, textSecondary, textMuted, accent, accentSoft, live, liveSoft, liveBorder, gold, goldSoft, win, draw, loss, promotion, relegation.
