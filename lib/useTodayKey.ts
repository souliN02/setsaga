import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { toLocalDateKey } from '@/lib/dates';

// Streak and week windows depend on "today". Live queries only re-run on DB
// changes, so a tab left open past midnight would keep yesterday's key until
// the next write — refreshing the key on every screen focus covers that.
export function useTodayKey(): string {
  const [todayKey, setTodayKey] = useState(() => toLocalDateKey(Date.now()));
  useFocusEffect(
    useCallback(() => {
      setTodayKey(toLocalDateKey(Date.now()));
    }, []),
  );
  return todayKey;
}
