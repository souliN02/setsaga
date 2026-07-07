import { and, asc, desc, eq, gt, inArray, isNull, like, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { nextSetNumberFor } from '@/lib/workout';

import { db } from './client';
import {
  exercises,
  sets,
  workouts,
  type Equipment,
  type Exercise,
  type MuscleGroup,
  type Workout,
  type WorkoutSet,
} from './schema';

// All SQL lives in this file. Screens call the hooks/mutations and never
// build queries themselves (CLAUDE.md conventions).

export function exercisesQuery(search: string, muscleGroup: MuscleGroup | null) {
  const filters = [];
  const term = search.trim();
  if (term.length > 0) {
    filters.push(like(exercises.name, `%${term}%`));
  }
  if (muscleGroup !== null) {
    filters.push(eq(exercises.muscleGroup, muscleGroup));
  }
  return db
    .select()
    .from(exercises)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(asc(exercises.name));
}

export function useExercises(search: string, muscleGroup: MuscleGroup | null) {
  return useLiveQuery(exercisesQuery(search, muscleGroup), [search, muscleGroup]);
}

export class DuplicateExerciseNameError extends Error {
  constructor(name: string) {
    super(`An exercise named "${name}" already exists.`);
    this.name = 'DuplicateExerciseNameError';
  }
}

export async function createCustomExercise(input: {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
}): Promise<Exercise> {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new Error('Exercise name must not be empty.');
  }
  try {
    const [row] = await db
      .insert(exercises)
      .values({ name, muscleGroup: input.muscleGroup, equipment: input.equipment, isCustom: true })
      .returning();
    return row;
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new DuplicateExerciseNameError(name);
    }
    throw error;
  }
}

// --- Workout session (Phase 2, write-through logging per SPEC.md section 4) ---

// One-shot launch detection of interrupted sessions, newest first.
export async function getUnfinishedWorkouts(): Promise<Workout[]> {
  return db.select().from(workouts).where(isNull(workouts.finishedAt)).orderBy(desc(workouts.startedAt));
}

// One-shot read for the recovery prompt (set count + exercise-order rebuild).
export async function getWorkoutSets(workoutId: number): Promise<WorkoutSet[]> {
  return db.select().from(sets).where(eq(sets.workoutId, workoutId)).orderBy(asc(sets.id));
}

// Live active-workout row (source of startedAt for the elapsed timer). The -1
// sentinel keeps the hook unconditional when no session is active.
export function useActiveWorkout(workoutId: number | null) {
  const { data } = useLiveQuery(
    db
      .select()
      .from(workouts)
      .where(eq(workouts.id, workoutId ?? -1)),
    [workoutId],
  );
  return data.length > 0 ? data[0] : null;
}

// Live sets for the active workout in insertion order.
export function useWorkoutSets(workoutId: number | null) {
  return useLiveQuery(
    db
      .select()
      .from(sets)
      .where(eq(sets.workoutId, workoutId ?? -1))
      .orderBy(asc(sets.id)),
    [workoutId],
  );
}

// Exercise rows for the session's section headers. inArray with [] is invalid
// SQL, so an empty selection uses a never-matching filter instead.
export function useExercisesByIds(ids: number[]) {
  return useLiveQuery(
    db
      .select()
      .from(exercises)
      .where(ids.length > 0 ? inArray(exercises.id, ids) : eq(exercises.id, -1)),
    [ids.join(',')],
  );
}

// The write-through row: the workout exists in SQLite from the first tap, with
// finishedAt = null marking it in-progress (crash recovery keys off this).
export async function startWorkout(): Promise<Workout> {
  const [row] = await db.insert(workouts).values({ startedAt: Date.now() }).returning();
  return row;
}

export async function addSet(input: {
  workoutId: number;
  exerciseId: number;
  reps: number;
  weightKg: number;
}): Promise<WorkoutSet> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ setNumber: sets.setNumber })
      .from(sets)
      .where(and(eq(sets.workoutId, input.workoutId), eq(sets.exerciseId, input.exerciseId)));
    const [row] = await tx
      .insert(sets)
      .values({ ...input, setNumber: nextSetNumberFor(existing), createdAt: Date.now() })
      .returning();
    return row;
  });
}

export async function updateSet(setId: number, changes: { reps: number; weightKg: number }): Promise<void> {
  await db.update(sets).set(changes).where(eq(sets.id, setId));
}

// Deleting renumbers later sets of the same exercise so setNumber stays a
// gapless 1-based sequence per exercise per workout (SPEC.md section 6).
export async function deleteSet(setId: number): Promise<void> {
  await db.transaction(async (tx) => {
    const [deleted] = await tx.select().from(sets).where(eq(sets.id, setId));
    if (!deleted) return;
    await tx.delete(sets).where(eq(sets.id, setId));
    await tx
      .update(sets)
      .set({ setNumber: sql`${sets.setNumber} - 1` })
      .where(
        and(
          eq(sets.workoutId, deleted.workoutId),
          eq(sets.exerciseId, deleted.exerciseId),
          gt(sets.setNumber, deleted.setNumber),
        ),
      );
  });
}

// The single finish entry point. Phase 3 seam: the post-workout pipeline
// (PR detection, badge unlocks) runs inside this function — screens must only
// ever call finishWorkout(), never stamp finishedAt another way.
export async function finishWorkout(workoutId: number): Promise<void> {
  await db.update(workouts).set({ finishedAt: Date.now() }).where(eq(workouts.id, workoutId));
}

// Sets are deleted explicitly (not left to the FK cascade) because SQLite's
// update hook — which powers the change listener behind useLiveQuery — does not
// reliably fire for cascade-deleted rows.
export async function discardWorkout(workoutId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(sets).where(eq(sets.workoutId, workoutId));
    await tx.delete(workouts).where(eq(workouts.id, workoutId));
  });
}
