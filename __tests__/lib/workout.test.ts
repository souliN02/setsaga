import type { Workout, WorkoutSet } from '@/lib/db/schema';
import {
  deriveExerciseOrder,
  groupSetsByExercise,
  lastSetFor,
  mergeExerciseOrder,
  nextSetNumberFor,
  parseReps,
  parseWeightKg,
  pickRecoveryWorkout,
} from '@/lib/workout';

function makeSet(overrides: Partial<WorkoutSet> & Pick<WorkoutSet, 'id' | 'exerciseId'>): WorkoutSet {
  return {
    workoutId: 1,
    setNumber: 1,
    reps: 5,
    weightKg: 60,
    isPr: false,
    createdAt: 0,
    ...overrides,
  };
}

function makeWorkout(overrides: Partial<Workout> & Pick<Workout, 'id' | 'startedAt'>): Workout {
  return { finishedAt: null, name: null, notes: null, ...overrides };
}

describe('nextSetNumberFor', () => {
  it('returns 1 when the exercise has no sets', () => {
    expect(nextSetNumberFor([])).toBe(1);
  });

  it('returns max + 1', () => {
    expect(nextSetNumberFor([{ setNumber: 1 }, { setNumber: 2 }])).toBe(3);
  });

  it('handles unordered input and gaps', () => {
    expect(nextSetNumberFor([{ setNumber: 3 }, { setNumber: 1 }])).toBe(4);
  });
});

describe('lastSetFor', () => {
  it('returns null when the exercise has no sets', () => {
    expect(lastSetFor([makeSet({ id: 1, exerciseId: 7 })], 8)).toBeNull();
  });

  it('returns the highest-id set for the exercise', () => {
    const sets = [
      makeSet({ id: 1, exerciseId: 7, reps: 5, weightKg: 60 }),
      makeSet({ id: 3, exerciseId: 7, reps: 3, weightKg: 70 }),
      makeSet({ id: 2, exerciseId: 8, reps: 10, weightKg: 20 }),
    ];
    expect(lastSetFor(sets, 7)).toMatchObject({ id: 3, reps: 3, weightKg: 70 });
  });
});

describe('deriveExerciseOrder', () => {
  it('returns [] for no sets', () => {
    expect(deriveExerciseOrder([])).toEqual([]);
  });

  it('orders unique exerciseIds by first logged set, even interleaved', () => {
    const sets = [
      { id: 1, exerciseId: 7 },
      { id: 2, exerciseId: 8 },
      { id: 3, exerciseId: 7 },
      { id: 4, exerciseId: 9 },
      { id: 5, exerciseId: 8 },
    ];
    expect(deriveExerciseOrder(sets)).toEqual([7, 8, 9]);
  });

  it('is insensitive to input order', () => {
    const sets = [
      { id: 4, exerciseId: 9 },
      { id: 1, exerciseId: 7 },
      { id: 2, exerciseId: 8 },
    ];
    expect(deriveExerciseOrder(sets)).toEqual([7, 8, 9]);
  });
});

describe('groupSetsByExercise', () => {
  it('groups sets per exercise preserving order within each group', () => {
    const sets = [
      makeSet({ id: 1, exerciseId: 7, setNumber: 1 }),
      makeSet({ id: 2, exerciseId: 8, setNumber: 1 }),
      makeSet({ id: 3, exerciseId: 7, setNumber: 2 }),
    ];
    const groups = groupSetsByExercise(sets);
    expect(groups.get(7)?.map((s) => s.id)).toEqual([1, 3]);
    expect(groups.get(8)?.map((s) => s.id)).toEqual([2]);
  });
});

describe('mergeExerciseOrder', () => {
  it('keeps store order first and appends DB-only ids', () => {
    expect(mergeExerciseOrder([7, 9], [8, 7])).toEqual([7, 9, 8]);
  });

  it('handles an empty store order (resume before store rebuild)', () => {
    expect(mergeExerciseOrder([], [8, 7])).toEqual([8, 7]);
  });

  it('does not duplicate ids present in both', () => {
    expect(mergeExerciseOrder([7, 8], [8, 7])).toEqual([7, 8]);
  });
});

describe('pickRecoveryWorkout', () => {
  it('returns no candidate for an empty list', () => {
    expect(pickRecoveryWorkout([])).toEqual({ resume: null, staleIds: [] });
  });

  it('returns the single unfinished workout with no stale ids', () => {
    const workout = makeWorkout({ id: 1, startedAt: 1000 });
    expect(pickRecoveryWorkout([workout])).toEqual({ resume: workout, staleIds: [] });
  });

  it('resumes the newest and marks the rest stale', () => {
    const older = makeWorkout({ id: 1, startedAt: 1000 });
    const newest = makeWorkout({ id: 2, startedAt: 3000 });
    const middle = makeWorkout({ id: 3, startedAt: 2000 });
    const { resume, staleIds } = pickRecoveryWorkout([older, newest, middle]);
    expect(resume).toBe(newest);
    expect(staleIds).toEqual([3, 1]);
  });
});

describe('parseReps', () => {
  it('parses positive integers', () => {
    expect(parseReps('8')).toBe(8);
    expect(parseReps(' 12 ')).toBe(12);
  });

  it('rejects zero, negatives, decimals and garbage', () => {
    expect(parseReps('0')).toBeNull();
    expect(parseReps('-3')).toBeNull();
    expect(parseReps('2.5')).toBeNull();
    expect(parseReps('')).toBeNull();
    expect(parseReps('abc')).toBeNull();
  });
});

describe('parseWeightKg', () => {
  it('parses integers and decimals, including 0 (bodyweight)', () => {
    expect(parseWeightKg('60')).toBe(60);
    expect(parseWeightKg('62.5')).toBe(62.5);
    expect(parseWeightKg('0')).toBe(0);
  });

  it('accepts a comma decimal separator', () => {
    expect(parseWeightKg('62,5')).toBe(62.5);
  });

  it('rejects negatives and garbage', () => {
    expect(parseWeightKg('-5')).toBeNull();
    expect(parseWeightKg('')).toBeNull();
    expect(parseWeightKg('heavy')).toBeNull();
    expect(parseWeightKg('1.2.3')).toBeNull();
  });
});
