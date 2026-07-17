import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer } from 'react';

const ENABLED_KEY = 'staðan:notifications-enabled';
const ASKED_KEY = 'staðan:notifications-asked';

// Module-level shared state — all hook instances read from and write to this.
let _enabled = false;
let _asked = false;
let _loaded = false;
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

Promise.all([AsyncStorage.getItem(ENABLED_KEY), AsyncStorage.getItem(ASKED_KEY)]).then(
  ([enabledVal, askedVal]) => {
    _enabled = enabledVal === '1';
    _asked = askedVal === '1';
    _loaded = true;
    _notify();
  },
);

export function useNotificationPreference() {
  const [, rerender] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    _listeners.add(rerender);
    return () => { _listeners.delete(rerender); };
  }, []);

  // Setting enabled (either direction) always implies we've asked — the
  // "asked" flag exists purely to gate the one-time inline CTA prompt.
  const setEnabled = useCallback((value: boolean) => {
    _enabled = value;
    _asked = true;
    AsyncStorage.setItem(ENABLED_KEY, value ? '1' : '0');
    AsyncStorage.setItem(ASKED_KEY, '1');
    _notify();
  }, []);

  const markAsked = useCallback(() => {
    _asked = true;
    AsyncStorage.setItem(ASKED_KEY, '1');
    _notify();
  }, []);

  return { enabled: _enabled, asked: _asked, setEnabled, markAsked, loaded: _loaded };
}
