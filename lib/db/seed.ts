import rawExercises from '@/data/exercises.json';

import type { Db } from './client';
import { EQUIPMENT, MUSCLE_GROUPS, exercises, type Equipment, type MuscleGroup, type NewExercise } from './schema';

function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === 'string' && (MUSCLE_GROUPS as readonly string[]).includes(value);
}

function isEquipment(value: unknown): value is Equipment {
  return typeof value === 'string' && (EQUIPMENT as readonly string[]).includes(value);
}

// Pure: validates the JSON and maps it to insert rows. Throws on malformed
// data so a bad edit to exercises.json fails tests, not silently at runtime.
export function prepareSeedRows(data: unknown): NewExercise[] {
  if (!Array.isArray(data)) {
    throw new Error('exercises.json: expected an array');
  }
  return data.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`exercises.json[${i}]: expected an object`);
    }
    const { name, muscleGroup, equipment } = entry as Record<string, unknown>;
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new Error(`exercises.json[${i}]: missing or empty name`);
    }
    if (!isMuscleGroup(muscleGroup)) {
      throw new Error(`exercises.json[${i}] (${name}): invalid muscleGroup "${String(muscleGroup)}"`);
    }
    if (!isEquipment(equipment)) {
      throw new Error(`exercises.json[${i}] (${name}): invalid equipment "${String(equipment)}"`);
    }
    return { name: name.trim(), muscleGroup, equipment, isCustom: false };
  });
}

// Idempotent: insert-or-ignore on the unique exercise name. Only ever inserts,
// so user-created rows (isCustom = 1) are never touched (SPEC.md section 7).
export async function seedExercises(db: Db): Promise<void> {
  const rows = prepareSeedRows(rawExercises);
  await db.insert(exercises).values(rows).onConflictDoNothing({ target: exercises.name });
}
