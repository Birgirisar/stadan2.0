import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer } from 'react';

const STORAGE_KEY = 'staðan:followed-teams';

// Module-level shared state — all hook instances read from and write to this.
let _ids: number[] = [];
let _loaded = false;
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((fn) => fn());
}

AsyncStorage.getItem(STORAGE_KEY).then((val) => {
  if (val) {
    try { _ids = JSON.parse(val); } catch { _ids = []; }
  }
  _loaded = true;
  _notify();
});

export function useFollowedTeams() {
  const [, rerender] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    _listeners.add(rerender);
    return () => { _listeners.delete(rerender); };
  }, []);

  const toggle = useCallback((id: number) => {
    _ids = _ids.includes(id) ? _ids.filter((x) => x !== id) : [..._ids, id];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_ids));
    _notify();
  }, []);

  // Reads module-level _ids at call time — always current after any re-render.
  const isFollowed = useCallback((id: number) => _ids.includes(id), []);

  return { followedIds: _ids, toggle, isFollowed, loaded: _loaded };
}
