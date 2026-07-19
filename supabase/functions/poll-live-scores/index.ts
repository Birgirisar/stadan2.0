// Manually-invoked (for now) Sportmonks poller. Fetches currently in-play
// fixtures, finds goal/red-card events and full-time transitions that
// haven't been sent yet, and pushes Icelandic notifications to whoever
// follows either team. Dedup is at-most-once: processed_events rows are
// inserted BEFORE dispatch, so a crash mid-dispatch never causes a repeat.
//
// MOCK=1 / MOCK=2 (as a query param, e.g. ?mock=1) replay canned
// Sportmonks-shaped snapshots from ./mocks so the whole pipeline can be
// exercised without a real live match.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { dispatchExpoPushes, type PushSubscription, type PushTarget } from "../_shared/expo-push.ts";
import mockPoll1 from "./mocks/poll-1.json" with { type: "json" };
import mockPoll2 from "./mocks/poll-2.json" with { type: "json" };

const SPORTMONKS_URL = "https://api.sportmonks.com/v3/football/livescores"; // 15-min post-FT retention, unlike /inplay
// `state` must be requested explicitly — without it fixture.state is always
// undefined, so isFinal() never fires and full-time notifications never send.
// `periods` is needed for catch-up suppression (elapsed match minute).
const SPORTMONKS_INCLUDE = "events;participants;scores;state;periods";

// A fixture we've never polled before, already more than this many minutes
// underway (or already finished), is treated as catch-up: its existing
// events are seeded into processed_events without notifying, so an outage
// or first deploy mid-match doesn't burst every past goal/card as "new".
const CATCH_UP_MINUTE_THRESHOLD = 5;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN")!;
const SPORTMONKS_API_KEY = Deno.env.get("SPORTMONKS_API_KEY");

// Sportmonks v3 event type_ids — verified against this repo's own
// lib/utils/events.ts, which already integrates with the same API.
const EVENT_TYPE = {
  GOAL: 14,
  OWN_GOAL: 15,
  PENALTY: 16,
  RED_CARD: 20,
  YELLOW_RED: 21, // second yellow — also a dismissal, treated as a red card
} as const;

const GOAL_TYPES = new Set<number>([EVENT_TYPE.GOAL, EVENT_TYPE.OWN_GOAL, EVENT_TYPE.PENALTY]);
const RED_CARD_TYPES = new Set<number>([EVENT_TYPE.RED_CARD, EVENT_TYPE.YELLOW_RED]);

// Same developer_name / short-code sets this repo's lib/utils/state.ts uses
// to classify a fixture as finished.
const FINAL_STATE_CODES = new Set([
  "FT", "AET", "FT_PEN", "AWARDED", "WO",
  "FINISHED", "FULL_TIME", "AFTER_EXTRA_TIME", "AFTER_PENALTIES",
]);

interface Participant {
  id: number;
  name: string;
  meta: { location: "home" | "away" };
}

interface ScoreEntry {
  participant_id: number;
  score: { goals: number; participant: "home" | "away" };
  description: string;
}

interface FixtureState {
  state?: string;
  is_final_state?: boolean;
}

interface FixtureEvent {
  id: number;
  fixture_id: number;
  participant_id: number;
  type_id: number;
  minute: number;
  extra_minute?: number | null;
  player_name?: string | null;
}

interface Period {
  ticking?: boolean;
  minutes?: number | null;
}

interface Fixture {
  id: number;
  participants?: Participant[];
  scores?: ScoreEntry[];
  state?: FixtureState;
  events?: FixtureEvent[];
  periods?: Period[];
}

type CandidateKind = "goal" | "red" | "ft";

interface Candidate {
  key: number; // maps to processed_events.event_id — negative for synthetic FT markers
  fixture: Fixture;
  kind: CandidateKind;
  event?: FixtureEvent;
  // true when this fixture was never polled before and is already well
  // underway (or finished) — seeded into processed_events, never pushed.
  seedOnly: boolean;
}

function getParticipants(fixture: Fixture): { home?: Participant; away?: Participant } {
  return {
    home: fixture.participants?.find((p) => p.meta.location === "home"),
    away: fixture.participants?.find((p) => p.meta.location === "away"),
  };
}

// Mirrors lib/utils/score.ts's getScore(), adapted for this function's local types.
function getScore(fixture: Fixture): { home: number | null; away: number | null } {
  const scores = fixture.scores ?? [];
  if (!scores.length) return { home: null, away: null };

  const locMap = new Map<number, "home" | "away">();
  for (const p of fixture.participants ?? []) locMap.set(p.id, p.meta.location);

  const pick = (entries: ScoreEntry[]) => {
    let home: number | null = null;
    let away: number | null = null;
    for (const e of entries) {
      const loc = locMap.get(e.participant_id) ?? e.score.participant;
      if (loc === "home") home = e.score.goals;
      else away = e.score.goals;
    }
    return { home, away };
  };

  const current = scores.filter((s) => s.description === "CURRENT");
  if (current.length) return pick(current);

  for (const desc of ["PENALTY_SHOOTOUT", "ET_2ND_HALF", "2ND_HALF", "1ST_HALF"]) {
    const entries = scores.filter((s) => s.description === desc);
    if (entries.length) return pick(entries);
  }

  return { home: null, away: null };
}

function isFinal(fixture: Fixture): boolean {
  const state = fixture.state;
  if (!state) return false;
  return !!state.is_final_state || FINAL_STATE_CODES.has(state.state ?? "");
}

// Mirrors lib/utils/state.ts's getLiveMinute(): the ticking period's minute
// count. Returns null if unknown (e.g. no period has started ticking yet).
function getElapsedMinute(fixture: Fixture): number | null {
  const active = (fixture.periods ?? []).find((p) => p.ticking === true);
  return active?.minutes ?? null;
}

// A fixture qualifies for catch-up seeding when we've never polled it before
// AND it's already well underway — including already finished, since a
// fixture that's finished the very first time we ever see it (e.g. after a
// long outage) has no ticking period left to report a minute from at all.
function isCatchUp(fixture: Fixture, alreadyKnown: boolean): boolean {
  if (alreadyKnown) return false;
  if (isFinal(fixture)) return true;
  const minute = getElapsedMinute(fixture);
  return minute != null && minute > CATCH_UP_MINUTE_THRESHOLD;
}

function minuteDative(e: FixtureEvent): string {
  const min = e.extra_minute ? `${e.minute}+${e.extra_minute}` : `${e.minute}`;
  return `${min}. mínútu`;
}

function minuteNominative(e: FixtureEvent): string {
  const min = e.extra_minute ? `${e.minute}+${e.extra_minute}` : `${e.minute}`;
  return `${min}. mínúta`;
}

function eventMinute(e: FixtureEvent): number {
  return e.minute + (e.extra_minute ?? 0);
}

// The fixture's `scores` total reflects the CURRENT state, not the state at
// the moment a given goal was scored. That's fine when exactly one new goal
// is found per poll (the steady-state case), but if several goals for the
// same fixture surface in the same poll — e.g. the very first poll after
// deploying, when every already-scored goal looks "new" — every one of them
// would otherwise report the same final scoreline. Replaying the fixture's
// own goal events in minute order gives the correct running score for each.
function runningScoreAt(
  fixture: Fixture,
  home: Participant,
  targetEvent: FixtureEvent,
): { home: number; away: number } {
  const goalEvents = (fixture.events ?? [])
    .filter((e) => GOAL_TYPES.has(e.type_id))
    .sort((a, b) => eventMinute(a) - eventMinute(b) || a.id - b.id);

  let homeGoals = 0;
  let awayGoals = 0;

  for (const e of goalEvents) {
    const scoredForHome =
      e.type_id === EVENT_TYPE.OWN_GOAL ? e.participant_id !== home.id : e.participant_id === home.id;

    if (scoredForHome) homeGoals++;
    else awayGoals++;

    if (e.id === targetEvent.id) break;
  }

  return { home: homeGoals, away: awayGoals };
}

function buildGoalMessage(
  fixture: Fixture,
  event: FixtureEvent,
  home: Participant,
  away: Participant,
): { title: string; body?: string } | null {
  const { home: hGoals, away: aGoals } = runningScoreAt(fixture, home, event);

  const title = `⚽ Mark! ${home.name} ${hGoals}–${aGoals} ${away.name}`;
  const scorer = event.player_name;
  const ownGoalSuffix = event.type_id === EVENT_TYPE.OWN_GOAL ? " (sjálfsmark)" : "";
  const body = scorer
    ? `${scorer}${ownGoalSuffix} skoraði á ${minuteDative(event)}`
    : `Mark${ownGoalSuffix} á ${minuteDative(event)}`;

  return { title, body };
}

function buildRedCardMessage(
  fixture: Fixture,
  event: FixtureEvent,
): { title: string; body?: string } | null {
  const team = fixture.participants?.find((p) => p.id === event.participant_id);
  if (!team) return null;

  const title = `🟥 Rautt spjald — ${team.name}`;
  const player = event.player_name;
  const body = player ? `${player}, ${minuteNominative(event)}` : minuteNominative(event);

  return { title, body };
}

function buildFullTimeMessage(
  fixture: Fixture,
  home: Participant,
  away: Participant,
): { title: string; body?: string } | null {
  const { home: hGoals, away: aGoals } = getScore(fixture);
  if (hGoals == null || aGoals == null) return null;

  return { title: `Leik lokið: ${home.name} ${hGoals}–${aGoals} ${away.name}` };
}

async function loadFixtures(mock: string | null): Promise<
  { ok: true; fixtures: Fixture[] } | { ok: false; error: string }
> {
  if (mock === "1") return { ok: true, fixtures: (mockPoll1 as { data: Fixture[] }).data };
  if (mock === "2") return { ok: true, fixtures: (mockPoll2 as { data: Fixture[] }).data };

  if (!SPORTMONKS_API_KEY) {
    console.error("[poll-live-scores] SPORTMONKS_API_KEY is not set");
    return { ok: false, error: "sportmonks_api_key_missing" };
  }

  const url = new URL(SPORTMONKS_URL);
  url.searchParams.set("api_token", SPORTMONKS_API_KEY);
  url.searchParams.set("include", SPORTMONKS_INCLUDE);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[poll-live-scores] Sportmonks returned ${res.status}: ${text.slice(0, 500)}`);
      return { ok: false, error: `sportmonks_http_${res.status}` };
    }
    const json = await res.json();
    return { ok: true, fixtures: (json?.data ?? []) as Fixture[] };
  } catch (err) {
    console.error("[poll-live-scores] fetch to Sportmonks failed:", err);
    return { ok: false, error: "sportmonks_fetch_failed" };
  }
}

function respond(summary: Record<string, unknown>, status = 200): Response {
  console.log("[poll-live-scores]", JSON.stringify(summary));
  return Response.json(summary, { status });
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${ADMIN_TOKEN}`) {
    return respond({ error: "unauthorized" }, 401);
  }

  const mock = new URL(req.url).searchParams.get("mock");

  const loaded = await loadFixtures(mock);
  if (!loaded.ok) {
    return respond({ error: loaded.error }, 502);
  }
  const { fixtures } = loaded;

  if (fixtures.length === 0) {
    return respond({ live: 0, newEvents: 0, sent: 0, failed: 0, mode: "normal", seededFixtures: 0 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Catch-up suppression only applies to real polls — mock mode always
  // behaves as documented (mock=1/mock=2 send normally, no seeding).
  const knownFixtureIds = new Set<number>();
  if (mock == null) {
    const { data: knownRows, error: knownError } = await supabase
      .from("processed_events")
      .select("fixture_id")
      .in("fixture_id", fixtures.map((f) => f.id));

    if (knownError) {
      console.error("[poll-live-scores] failed to check known fixtures:", knownError);
      return respond({ error: knownError.message }, 500);
    }

    for (const row of knownRows ?? []) knownFixtureIds.add(row.fixture_id as number);
  }

  const candidates: Candidate[] = [];
  let seededFixtures = 0;

  for (const fixture of fixtures) {
    const alreadyKnown = mock != null || knownFixtureIds.has(fixture.id);
    const seedOnly = isCatchUp(fixture, alreadyKnown);
    if (seedOnly) seededFixtures += 1;

    for (const event of fixture.events ?? []) {
      if (GOAL_TYPES.has(event.type_id)) {
        candidates.push({ key: event.id, fixture, kind: "goal", event, seedOnly });
      } else if (RED_CARD_TYPES.has(event.type_id)) {
        candidates.push({ key: event.id, fixture, kind: "red", event, seedOnly });
      }
    }
    // Synthetic key: negative fixture id. Real Sportmonks event ids are
    // always positive, so this can never collide with a real event.
    if (isFinal(fixture)) {
      candidates.push({ key: -fixture.id, fixture, kind: "ft", seedOnly });
    }
  }

  const mode = seededFixtures > 0 ? "seeded" : "normal";

  if (candidates.length === 0) {
    return respond({ live: fixtures.length, newEvents: 0, sent: 0, failed: 0, mode, seededFixtures });
  }

  const { data: existing, error: existingError } = await supabase
    .from("processed_events")
    .select("event_id")
    .in("event_id", candidates.map((c) => c.key));

  if (existingError) {
    console.error("[poll-live-scores] failed to check processed_events:", existingError);
    return respond({ error: existingError.message }, 500);
  }

  const existingIds = new Set((existing ?? []).map((r) => r.event_id as number));
  const fresh = candidates.filter((c) => !existingIds.has(c.key));

  if (fresh.length === 0) {
    return respond({ live: fixtures.length, newEvents: 0, sent: 0, failed: 0, mode, seededFixtures });
  }

  // Record BEFORE dispatch — a duplicate push is worse than a missed one.
  // This includes seed-only candidates: seeding IS inserting the row so
  // future polls treat them as already-processed.
  const { error: insertError } = await supabase
    .from("processed_events")
    .insert(fresh.map((c) => ({ event_id: c.key, fixture_id: c.fixture.id })));

  if (insertError) {
    console.error("[poll-live-scores] failed to record processed events:", insertError);
    return respond({ error: insertError.message }, 500);
  }

  const targets: PushTarget[] = [];

  for (const candidate of fresh) {
    if (candidate.seedOnly) continue; // silently seeded — never pushed

    const { home, away } = getParticipants(candidate.fixture);
    if (!home || !away) continue;

    let message: { title: string; body?: string } | null;
    switch (candidate.kind) {
      case "goal":
        message = buildGoalMessage(candidate.fixture, candidate.event!, home, away);
        break;
      case "red":
        message = buildRedCardMessage(candidate.fixture, candidate.event!);
        break;
      case "ft":
        message = buildFullTimeMessage(candidate.fixture, home, away);
        break;
    }
    if (!message) continue;

    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select("id, push_token")
      .overlaps("team_ids", [home.id, away.id]);

    if (subsError) {
      console.error("[poll-live-scores] failed to load subscriptions:", subsError);
      continue;
    }

    for (const subscription of (subs ?? []) as PushSubscription[]) {
      targets.push({
        subscription,
        title: message.title,
        body: message.body,
        data: { fixtureId: candidate.fixture.id },
      });
    }
  }

  const { sent, failed } = await dispatchExpoPushes(supabase, targets);

  return respond({ live: fixtures.length, newEvents: fresh.length, sent, failed, mode, seededFixtures });
});

/* To invoke:

  curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/poll-live-scores' \
    --header "apikey: $SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $ADMIN_TOKEN"

  Mock mode (no Sportmonks call, replays supabase/functions/poll-live-scores/mocks/poll-{1,2}.json):

  curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/poll-live-scores?mock=1' \
    --header "apikey: $SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $ADMIN_TOKEN"

*/
