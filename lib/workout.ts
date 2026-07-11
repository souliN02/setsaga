import type { Workout, WorkoutSet } from '@/lib/db/schema';

// Pure session/set logic — no React, no DB, no Expo imports (CLAUDE.md conventions).
// Everything that decides *what* to write or show lives here so it stays unit-testable;
// lib/db/queries.ts is thin SQL glue around these helpers.

/** Next 1-based setNumber for an exercise within a workout. */
export function nextSetNumberFor(setsForExercise: Pick<WorkoutSet, 'setNumber'>[]): number {
  let max = 0;
  for (const set of setsForExercise) {
    if (set.setNumber > max) max = set.setNumber;
  }
  return max + 1;
}

/** Most recently logged set for an exercise (highest id) — source of quick-add defaults. */
export function lastSetFor(sets: WorkoutSet[], exerciseId: number): WorkoutSet | null {
  let last: WorkoutSet | null = null;
  for (const set of sets) {
    if (set.exerciseId === exerciseId && (last === null || set.id > last.id)) {
      last = set;
    }
  }
  return last;
}

/** Unique exerciseIds ordered by first logged set — rebuilds session order on resume. */
export function deriveExerciseOrder(sets: Pick<WorkoutSet, 'exerciseId' | 'id'>[]): number[] {
  const firstSetId = new Map<number, number>();
  for (const set of sets) {
    const existing = firstSetId.get(set.exerciseId);
    if (existing === undefined || set.id < existing) {
      firstSetId.set(set.exerciseId, set.id);
    }
  }
  return [...firstSetId.entries()].sort((a, b) => a[1] - b[1]).map(([exerciseId]) => exerciseId);
}

/** Sets grouped per exercise, preserving the input order within each group. */
export function groupSetsByExercise<T extends Pick<WorkoutSet, 'exerciseId'>>(
  sets: T[],
): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const set of sets) {
    const group = groups.get(set.exerciseId);
    if (group) {
      group.push(set);
    } else {
      groups.set(set.exerciseId, [set]);
    }
  }
  return groups;
}

/**
 * Session display order: the store's order first, then any exerciseIds that only
 * exist in the DB (defensive — a logged set must never be invisible).
 */
export function mergeExerciseOrder(storeOrder: number[], setsOrder: number[]): number[] {
  const merged = [...storeOrder];
  const seen = new Set(storeOrder);
  for (const exerciseId of setsOrder) {
    if (!seen.has(exerciseId)) {
      merged.push(exerciseId);
      seen.add(exerciseId);
    }
  }
  return merged;
}

/**
 * Launch recovery: the newest unfinished workout is the resume candidate; any
 * others are stale rows to discard silently (the UI can never create them, but
 * recovery must never resume the wrong one).
 */
export function pickRecoveryWorkout(unfinished: Workout[]): {
  resume: Workout | null;
  staleIds: number[];
} {
  if (unfinished.length === 0) {
    return { resume: null, staleIds: [] };
  }
  const byNewest = [...unfinished].sort((a, b) => b.startedAt - a.startedAt);
  return { resume: byNewest[0], staleIds: byNewest.slice(1).map((workout) => workout.id) };
}

/** Parse a reps input: positive integer, else null. */
export function parseReps(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const reps = Number(trimmed);
  return reps > 0 ? reps : null;
}

/** Parse a weight input in kg: >= 0, accepts ',' as decimal separator, else null. */
export function parseWeightKg(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const weightKg = Number(trimmed);
  return Number.isFinite(weightKg) ? weightKg : null;
}
