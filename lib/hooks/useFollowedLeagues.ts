import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'staðan:followed-leagues';

export function useFollowedLeagues() {
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setFollowedIds(JSON.parse(val));
        } catch {
          setFollowedIds([]);
        }
      }
      setLoaded(true);
    });
  }, []);

  const toggle = useCallback((id: number) => {
    setFollowedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFollowed = useCallback((id: number) => followedIds.includes(id), [followedIds]);

  return { followedIds, toggle, isFollowed, loaded };
}
