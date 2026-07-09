// Streak rules per SPEC.md section 8.3, operating only on local date keys —
// callers convert timestamps via toLocalDateKey, never pass raw unix ms here.

import { daysBetween } from '@/lib/dates';

// Two training days chain when ≤ 2 calendar days apart: at most one full rest
// day between them, so nobody loses a streak for resting.
const MAX_CHAIN_GAP_DAYS = 2;

/** Unique training-day keys, ascending (YYYY-MM-DD sorts chronologically). */
function normalizeTrainingDays(trainingDayKeys: string[]): string[] {
  return [...new Set(trainingDayKeys)].sort();
}

/**
 * Length of the training-day chain containing the most recent training day,
 * or 0 once that day is more than 2 calendar days before today.
 */
export function currentStreak(trainingDayKeys: string[], todayKey: string): number {
  const days = normalizeTrainingDays(trainingDayKeys);
  if (days.length === 0) return 0;
  if (daysBetween(days[days.length - 1], todayKey) > MAX_CHAIN_GAP_DAYS) return 0;
  let streak = 1;
  for (let i = days.length - 1; i > 0; i -= 1) {
    if (daysBetween(days[i - 1], days[i]) > MAX_CHAIN_GAP_DAYS) break;
    streak += 1;
  }
  return streak;
}

/** True exactly when the streak is alive but expires tonight: last training day 2 days ago. */
export function isStreakAtRisk(trainingDayKeys: string[], todayKey: string): boolean {
  const days = normalizeTrainingDays(trainingDayKeys);
  if (days.length === 0) return false;
  return daysBetween(days[days.length - 1], todayKey) === MAX_CHAIN_GAP_DAYS;
}
