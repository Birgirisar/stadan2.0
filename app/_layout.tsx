import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Pause React Query polling when the app is backgrounded / screen locked,
// resume when it comes back to the foreground.
function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}
import { BottomDock } from '../components/ui/BottomDock';
import { useFollowedTeams } from '../lib/hooks/useFollowedTeams';
import { useNotificationPreference } from '../lib/hooks/useNotificationPreference';
import { scheduleSyncSubscription } from '../lib/notifications';
import { ThemeProvider } from '../lib/theme/ThemeProvider';
import { useTheme } from '../lib/theme/useTheme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

function AppShell() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tabs are root screens — swipe-back from a tab would pop to whatever was
            in the stack before (e.g. match detail), which is never the right thing. */}
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack>
      <BottomDock />
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const { followedIds, loaded: teamsLoaded } = useFollowedTeams();
  const { enabled: notificationsEnabled, loaded: notifPrefLoaded } = useNotificationPreference();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  // Syncs the current token + followed teams on launch and on every change —
  // debounced, so rapid follow/unfollow taps don't fire one request each.
  useEffect(() => {
    if (!teamsLoaded || !notifPrefLoaded || !notificationsEnabled) return;
    scheduleSyncSubscription(followedIds);
  }, [teamsLoaded, notifPrefLoaded, notificationsEnabled, followedIds]);

  // Deep-link on notification tap — covers both a warm tap (app already
  // running) and a cold start (app launched by tapping the notification),
  // since useLastNotificationResponse reflects the launch response too.
  useEffect(() => {
    const raw = lastNotificationResponse?.notification.request.content.data?.fixtureId;
    const fixtureId =
      typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : null;

    if (fixtureId != null) {
      router.push(`/match/${fixtureId}` as any);
      Notifications.clearLastNotificationResponse();
    }
  }, [lastNotificationResponse]);

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedStatusBar />
          <AppShell />
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
