import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications while the app is in the foreground (default behavior is to suppress them).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type PushTokenResult =
  | { status: 'granted'; token: string }
  | { status: 'denied' }
  | { status: 'unsupported' };

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function registerForPushNotificationsAsync(): Promise<PushTokenResult> {
  if (!Device.isDevice) {
    return { status: 'unsupported' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return { status: 'denied' };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  return { status: 'granted', token };
}

// Fetches the current token WITHOUT requesting permission — used for
// background syncs where we must never surface the OS prompt.
async function getCurrentPushToken(): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  if (!Device.isDevice) return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (err) {
    console.error('[notifications] failed to get push token:', err);
    return null;
  }
}

async function postTokenToBackend(token: string, teamIds: number[]): Promise<void> {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: PUBLISHABLE_KEY ?? '',
      },
      body: JSON.stringify({
        push_token: token,
        platform: Platform.OS,
        team_ids: teamIds,
      }),
    });
    if (!res.ok) {
      console.error('[notifications] register-token failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[notifications] failed to reach register-token:', err);
  }
}

// Always fetches a fresh token (never a cached one) so token rotation is
// picked up automatically, then upserts it with the given team list.
// No-ops silently if permission isn't granted or we're on a simulator.
export async function syncSubscription(teamIds: number[]): Promise<void> {
  const token = await getCurrentPushToken();
  if (!token) return;
  await postTokenToBackend(token, teamIds);
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced so rapid follow/unfollow taps don't fire one request per tap.
export function scheduleSyncSubscription(teamIds: number[], delayMs = 1500): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncSubscription(teamIds).catch((err) => console.error('[notifications] scheduled sync failed:', err));
  }, delayMs);
}

// Requests permission (surfacing the OS dialog if not yet decided) and, if
// granted, immediately registers the token with the given team list.
export async function enableNotifications(teamIds: number[]): Promise<PushTokenResult> {
  const result = await registerForPushNotificationsAsync();
  if (result.status === 'granted') {
    await postTokenToBackend(result.token, teamIds);
  }
  return result;
}

// Re-registers the current token with an empty team list so the backend
// stops sending, without touching OS permission (which the app can't revoke).
export async function disableNotifications(): Promise<void> {
  const token = await getCurrentPushToken();
  if (!token) return;
  await postTokenToBackend(token, []);
}
