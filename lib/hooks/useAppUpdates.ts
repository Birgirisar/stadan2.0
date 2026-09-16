import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Checks for an EAS Update on launch and whenever the app returns to the
 * foreground, downloads it in the background, and reports when it's ready
 * to apply. Reload is left to the caller (UpdateBanner) — mid-scroll or
 * mid-live-match isn't the moment to yank the JS bundle out from under
 * someone.
 *
 * A no-op wherever expo-updates isn't active (Expo Go, dev client, or any
 * build without a published update channel) — Updates.isEnabled covers all
 * of those.
 */
export function useAppUpdates() {
  const [updateReady, setUpdateReady] = useState(false);
  const checkingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (!Updates.isEnabled || checkingRef.current || updateReady) return;
    checkingRef.current = true;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateReady(true);
      }
    } catch {
      // Offline, or the update server hiccupped — silently try again next time.
    } finally {
      checkingRef.current = false;
    }
  }, [updateReady]);

  useEffect(() => {
    checkForUpdate();

    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') checkForUpdate();
    });
    return () => sub.remove();
  }, [checkForUpdate]);

  const applyUpdate = useCallback(() => {
    Updates.reloadAsync();
  }, []);

  return { updateReady, applyUpdate };
}
