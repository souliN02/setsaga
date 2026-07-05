import { and, asc, eq, like } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from './client';
import { exercises, type Equipment, type Exercise, type MuscleGroup } from './schema';

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
