import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Single source of truth for DB shape and domain types (SPEC.md section 6).
// Weights are kg (real), timestamps are unix ms integers.

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'other',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  muscleGroup: text('muscleGroup', { enum: MUSCLE_GROUPS }).notNull(),
  equipment: text('equipment', { enum: EQUIPMENT }).notNull(),
  isCustom: integer('isCustom', { mode: 'boolean' }).notNull().default(false),
});

export const workouts = sqliteTable(
  'workouts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startedAt: integer('startedAt').notNull(),
    // null = workout in progress (write-through logging, SPEC.md section 4)
    finishedAt: integer('finishedAt'),
    name: text('name'),
    notes: text('notes'),
  },
  (table) => [index('workouts_finishedAt_idx').on(table.finishedAt)],
);

export const sets = sqliteTable(
  'sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutId: integer('workoutId')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: integer('exerciseId')
      .notNull()
      .references(() => exercises.id),
    setNumber: integer('setNumber').notNull(),
    reps: integer('reps').notNull(),
    weightKg: real('weightKg').notNull(),
    isPr: integer('isPr', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
  },
  (table) => [
    index('sets_workoutId_idx').on(table.workoutId),
    index('sets_exerciseId_idx').on(table.exerciseId),
  ],
);

export const achievements = sqliteTable('achievements', {
  // matches a badge id from lib/game/badges.ts (Phase 3)
  badgeId: text('badgeId').primaryKey(),
  unlockedAt: integer('unlockedAt').notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutSet = typeof sets.$inferSelect;
export type NewWorkoutSet = typeof sets.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
