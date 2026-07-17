// Called by the app (in a later milestone) to register/update a device's
// Expo push token. Upserts on push_token so re-registering the same device
// just refreshes its row. No auth beyond payload validation — this is meant
// to be reachable with the publishable/anon key once the client is wired up.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EXPO_PUSH_TOKEN_RE = /^ExponentPushToken\[[^\]]+\]$/;

interface RegisterTokenBody {
  push_token?: unknown;
  platform?: unknown;
  team_ids?: unknown;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  let body: RegisterTokenBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { push_token, platform, team_ids } = body;

  if (typeof push_token !== "string" || !EXPO_PUSH_TOKEN_RE.test(push_token)) {
    return Response.json(
      { error: "push_token must look like ExponentPushToken[...]" },
      { status: 400 },
    );
  }

  if (platform !== "ios" && platform !== "android") {
    return Response.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 });
  }

  if (
    team_ids !== undefined &&
    (!Array.isArray(team_ids) || !team_ids.every((id) => Number.isInteger(id)))
  ) {
    return Response.json({ error: "team_ids must be an array of integers" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      { push_token, platform, team_ids: team_ids ?? [] },
      { onConflict: "push_token" },
    );

  if (error) {
    console.error("[register-token] upsert failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
});

/* To invoke:

  curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/register-token' \
    --header "apikey: $SUPABASE_ANON_KEY" \
    --header "Content-Type: application/json" \
    --data '{"push_token":"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]","platform":"ios","team_ids":[]}'

*/
