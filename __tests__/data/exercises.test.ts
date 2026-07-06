import exercisesJson from '@/data/exercises.json';
import { EQUIPMENT, MUSCLE_GROUPS, type MuscleGroup } from '@/lib/db/schema';

// SPEC.md section 7: ~100 exercises with a fixed per-group distribution.
const EXPECTED_DISTRIBUTION: Record<MuscleGroup, number> = {
  legs: 25,
  back: 20,
  chest: 15,
  shoulders: 12,
  arms: 15,
  core: 10,
  full_body: 3,
};

describe('data/exercises.json', () => {
  it('contains exactly 100 exercises', () => {
    expect(exercisesJson).toHaveLength(100);
  });

  it('has no duplicate names (case-insensitive)', () => {
    const names = exercisesJson.map((exercise) => exercise.name.trim().toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('has a non-empty name on every entry', () => {
    for (const exercise of exercisesJson) {
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses only valid muscle groups and equipment', () => {
    const validGroups: readonly string[] = MUSCLE_GROUPS;
    const validEquipment: readonly string[] = EQUIPMENT;
    for (const exercise of exercisesJson) {
      expect(validGroups).toContain(exercise.muscleGroup);
      expect(validEquipment).toContain(exercise.equipment);
    }
  });

  it('matches the SPEC section 7 distribution exactly', () => {
    const counts: Record<string, number> = {};
    for (const exercise of exercisesJson) {
      counts[exercise.muscleGroup] = (counts[exercise.muscleGroup] ?? 0) + 1;
    }
    expect(counts).toEqual(EXPECTED_DISTRIBUTION);
  });
});
