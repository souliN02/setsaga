import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, like, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { toLocalDateKey } from '@/lib/dates';
import { newBadgeUnlocks, type BadgeStats } from '@/lib/game/badges';
import { detectPrs, type PrEvent } from '@/lib/game/prs';
import { deriveGameStats, type GameStats } from '@/lib/game/stats';
import { levelForXp, totalXp } from '@/lib/game/xp';
import { nextSetNumberFor } from '@/lib/workout';

import { db } from './client';
import {
  achievements,
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

// --- Post-workout pipeline (Phase 3, SPEC.md sections 4 and 8) ---

// Per-set rows of finished workouts — the one input deriveGameStats needs.
// The inner join to sets enforces the section 6 definition throughout: a
// workout only counts once it is finished AND contains at least one set.
type GameStatsTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function selectGameStatRows(dbOrTx: GameStatsTx | typeof db) {
  return dbOrTx
    .select({
      workoutId: sets.workoutId,
      startedAt: workouts.startedAt,
      reps: sets.reps,
      weightKg: sets.weightKg,
      isPr: sets.isPr,
    })
    .from(sets)
    .innerJoin(workouts, eq(sets.workoutId, workouts.id))
    .where(isNotNull(workouts.finishedAt));
}

async function loadGameStats(tx: GameStatsTx, todayKey: string): Promise<GameStats> {
  return deriveGameStats(await selectGameStatRows(tx), todayKey);
}

// Live derived stats for Home and Achievements — same rows, same pure
// derivation as the pipeline, so the screens can never disagree with it.
// todayKey is a dependency: a new day shifts streak and week windows.
export function useGameStats(todayKey: string): GameStats {
  const { data } = useLiveQuery(selectGameStatRows(db), [todayKey]);
  return deriveGameStats(data, todayKey);
}

// Recent PRs for the Home screen. isPr is only ever flagged by the finish
// pipeline, so PR sets are always in finished workouts — no extra join needed.
export function useRecentPrs(limit: number) {
  return useLiveQuery(
    db
      .select({
        setId: sets.id,
        exerciseName: exercises.name,
        weightKg: sets.weightKg,
        createdAt: sets.createdAt,
      })
      .from(sets)
      .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
      .where(eq(sets.isPr, true))
      .orderBy(desc(sets.createdAt))
      .limit(limit),
    [limit],
  );
}

// Live unlock rows for the Achievements grid (badgeId → unlockedAt).
export function useAchievements() {
  return useLiveQuery(db.select().from(achievements));
}

function levelFromStats(stats: BadgeStats): number {
  return levelForXp(
    totalXp({ sets: stats.lifetimeSets, workouts: stats.finishedWorkouts, prEvents: stats.prEvents }),
  );
}

// What the finishing screen needs for celebration toasts (UI lands in Phase 4).
export interface FinishWorkoutResult {
  prEvents: PrEvent[];
  unlockedBadgeIds: string[];
  levelBefore: number;
  levelAfter: number;
}

// The single finish entry point: stamps finishedAt and runs the post-workout
// pipeline (PR flags, badge unlock rows) in one transaction — screens must
// only ever call finishWorkout(), never stamp finishedAt another way.
export async function finishWorkout(workoutId: number): Promise<FinishWorkoutResult> {
  const finishedAt = Date.now();
  const todayKey = toLocalDateKey(finishedAt);
  return db.transaction(async (tx) => {
    const workoutSets = await tx.select().from(sets).where(eq(sets.workoutId, workoutId));

    // This workout is still unfinished, so "before" stats naturally exclude it.
    const before = await loadGameStats(tx, todayKey);

    // PRs compare against all previously finished workouts for each exercise.
    let prEvents: PrEvent[] = [];
    if (workoutSets.length > 0) {
      const exerciseIds = [...new Set(workoutSets.map((set) => set.exerciseId))];
      const previousMaxRows = await tx
        .select({
          exerciseId: sets.exerciseId,
          maxWeightKg: sql<number>`max(${sets.weightKg})`,
        })
        .from(sets)
        .innerJoin(workouts, eq(sets.workoutId, workouts.id))
        .where(and(isNotNull(workouts.finishedAt), inArray(sets.exerciseId, exerciseIds)))
        .groupBy(sets.exerciseId);
      prEvents = detectPrs(
        workoutSets,
        new Map(previousMaxRows.map((row) => [row.exerciseId, row.maxWeightKg])),
      );
      if (prEvents.length > 0) {
        await tx
          .update(sets)
          .set({ isPr: true })
          .where(
            inArray(
              sets.id,
              prEvents.map((event) => event.setId),
            ),
          );
      }
    }

    await tx.update(workouts).set({ finishedAt }).where(eq(workouts.id, workoutId));

    // Badges are evaluated on stats that now include this workout; only
    // criteria without an existing unlock row produce new achievements.
    const after = await loadGameStats(tx, todayKey);
    const unlockedRows = await tx.select({ badgeId: achievements.badgeId }).from(achievements);
    const unlocked = newBadgeUnlocks(after, new Set(unlockedRows.map((row) => row.badgeId)));
    if (unlocked.length > 0) {
      await tx
        .insert(achievements)
        .values(unlocked.map((badge) => ({ badgeId: badge.id, unlockedAt: finishedAt })));
    }

    return {
      prEvents,
      unlockedBadgeIds: unlocked.map((badge) => badge.id),
      levelBefore: levelFromStats(before),
      levelAfter: levelFromStats(after),
    };
  });
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
