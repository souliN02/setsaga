// Derived gamification stats per SPEC.md section 4: computed from finished
// workout data on demand, never stored or incremented. This is the single
// derivation used by both the post-workout pipeline and the live UI hooks, so
// what the Home screen shows and what badges unlock on can never disagree.

import { startOfWeekKey, toLocalDateKey } from '@/lib/dates';

import type { BadgeStats } from './badges';
import { currentStreak, isStreakAtRisk } from './streak';

/** One set of a finished workout — the query supplying rows enforces that. */
export interface GameStatRow {
  workoutId: number;
  startedAt: number;
  reps: number;
  weightKg: number;
  isPr: boolean;
}

export interface GameStats extends BadgeStats {
  streakAtRisk: boolean;
  /** Workouts and volume in the Monday–Sunday week containing today. */
  weekWorkouts: number;
  weekVolumeKg: number;
}

export function deriveGameStats(rows: readonly GameStatRow[], todayKey: string): GameStats {
  const volumeByWorkout = new Map<number, number>();
  const startedAtByWorkout = new Map<number, number>();
  let prEvents = 0;
  let lifetimeVolume = 0;

  for (const row of rows) {
    const volume = row.weightKg * row.reps;
    lifetimeVolume += volume;
    volumeByWorkout.set(row.workoutId, (volumeByWorkout.get(row.workoutId) ?? 0) + volume);
    startedAtByWorkout.set(row.workoutId, row.startedAt);
    if (row.isPr) prEvents += 1;
  }

  let maxSessionVolume = 0;
  for (const volume of volumeByWorkout.values()) {
    maxSessionVolume = Math.max(maxSessionVolume, volume);
  }

  const trainingDayKeys = [...startedAtByWorkout.values()].map(toLocalDateKey);

  const weekKey = startOfWeekKey(todayKey);
  let weekWorkouts = 0;
  let weekVolumeKg = 0;
  for (const [workoutId, startedAt] of startedAtByWorkout) {
    if (startOfWeekKey(toLocalDateKey(startedAt)) !== weekKey) continue;
    weekWorkouts += 1;
    weekVolumeKg += volumeByWorkout.get(workoutId) ?? 0;
  }

  return {
    finishedWorkouts: volumeByWorkout.size,
    lifetimeSets: rows.length,
    prEvents,
    lifetimeVolume,
    maxSessionVolume,
    currentStreak: currentStreak(trainingDayKeys, todayKey),
    streakAtRisk: isStreakAtRisk(trainingDayKeys, todayKey),
    weekWorkouts,
    weekVolumeKg,
  };
}
