import { addDaysToKey, startOfWeekKey, toLocalDateKey } from '@/lib/dates';

// Pure chart-shaping for the History screen — no React, no DB, no Expo imports
// (CLAUDE.md conventions). Week bucketing happens here, not in SQL, because
// SQLite can't apply toLocalDateKey()'s local-timezone day boundaries.

/** One bar of the weekly volume chart. */
export interface WeeklyVolumeBucket {
  /** Monday of the week, as a YYYY-MM-DD key. */
  weekStartKey: string;
  volumeKg: number;
}

/**
 * The last weekCount Monday-start weeks ending at the week containing
 * todayKey, oldest first. Weeks without workouts are zero-filled so the chart
 * shows honest gaps; rows outside the window are ignored.
 */
export function weeklyVolumeBuckets(
  rows: readonly { startedAt: number; volumeKg: number }[],
  todayKey: string,
  weekCount = 8,
): WeeklyVolumeBucket[] {
  const currentWeekKey = startOfWeekKey(todayKey);
  const volumeByWeek = new Map<string, number>();
  for (let stepsBack = weekCount - 1; stepsBack >= 0; stepsBack--) {
    volumeByWeek.set(addDaysToKey(currentWeekKey, -7 * stepsBack), 0);
  }

  for (const row of rows) {
    const weekKey = startOfWeekKey(toLocalDateKey(row.startedAt));
    const volume = volumeByWeek.get(weekKey);
    if (volume === undefined) continue;
    volumeByWeek.set(weekKey, volume + row.volumeKg);
  }

  return [...volumeByWeek.entries()].map(([weekStartKey, volumeKg]) => ({
    weekStartKey,
    volumeKg,
  }));
}
