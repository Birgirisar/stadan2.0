// Manually-invoked test function. Sends a hardcoded push to every stored
// token via Expo's push API. Requires ADMIN_TOKEN as a bearer token — this
// is not meant to be reachable by the app, only by us via curl.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { dispatchExpoPushes, type PushSubscription, type PushTarget } from "../_shared/expo-push.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN")!;

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${ADMIN_TOKEN}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await supabase.from("subscriptions").select("id, push_token");

  if (error) {
    console.error("[send-test-push] failed to load subscriptions:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const subs = (data ?? []) as PushSubscription[];
  const targets: PushTarget[] = subs.map((subscription) => ({
    subscription,
    title: "Staðan próf ⚽",
    body: "Þetta er prufutilkynning",
  }));

  const { sent, failed } = await dispatchExpoPushes(supabase, targets);

  return Response.json({ sent, failed });
});

/* To invoke:

  curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/send-test-push' \
    --header "apikey: $SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $ADMIN_TOKEN"

*/
