// Shared by send-test-push and poll-live-scores: batches messages to Expo's
// push API (100 per request, per Expo's recommendation), checks the returned
// tickets, and prunes subscriptions Expo reports as DeviceNotRegistered.

import type { SupabaseClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export interface PushSubscription {
  id: number;
  push_token: string;
}

export interface PushTarget {
  subscription: PushSubscription;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function dispatchExpoPushes(
  supabase: SupabaseClient,
  targets: PushTarget[],
): Promise<{ sent: number; failed: number }> {
  if (targets.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const staleIds: number[] = [];

  for (const batch of chunk(targets, CHUNK_SIZE)) {
    const messages = batch.map((t) => ({
      to: t.subscription.push_token,
      title: t.title,
      body: t.body,
      data: t.data,
      sound: "default",
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error(`[expo-push] Expo push API returned ${res.status}`);
      failed += batch.length;
      continue;
    }

    const { data: tickets } = (await res.json()) as { data: ExpoPushTicket[] };

    tickets.forEach((ticket, i) => {
      const target = batch[i];

      if (ticket.status === "ok") {
        sent += 1;
        return;
      }

      failed += 1;
      console.error(`[expo-push] ticket error for ${target.subscription.push_token}:`, ticket.message);

      if (ticket.details?.error === "DeviceNotRegistered") {
        staleIds.push(target.subscription.id);
      }
    });
  }

  if (staleIds.length > 0) {
    const { error } = await supabase.from("subscriptions").delete().in("id", staleIds);
    if (error) {
      console.error("[expo-push] failed to delete stale subscriptions:", error);
    } else {
      console.log(`[expo-push] removed ${staleIds.length} stale subscription(s)`);
    }
  }

  return { sent, failed };
}
