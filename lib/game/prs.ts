// PR detection per SPEC.md section 8.4: weight-based, per exercise, at most
// one PR event per exercise per finishing workout.

/** The slice of a set row PR detection needs (WorkoutSet satisfies it structurally). */
export interface PrSetInput {
  id: number;
  exerciseId: number;
  weightKg: number;
  setNumber: number;
}

export interface PrEvent {
  exerciseId: number;
  setId: number;
  weightKg: number;
}

/**
 * PR events for a finishing workout. previousMaxByExercise holds max(weightKg)
 * across all previously finished workouts; an exercise absent from the map has
 * no history, so its first weighted set is a baseline PR. The flagged set is
 * the workout's heaviest qualifying one — ties go to the earliest setNumber,
 * because that's when the weight was first lifted.
 */
export function detectPrs(
  workoutSets: PrSetInput[],
  previousMaxByExercise: ReadonlyMap<number, number>,
): PrEvent[] {
  const bestByExercise = new Map<number, PrSetInput>();
  for (const set of workoutSets) {
    if (set.weightKg <= 0) continue; // bodyweight sets never qualify
    const best = bestByExercise.get(set.exerciseId);
    if (
      best === undefined ||
      set.weightKg > best.weightKg ||
      (set.weightKg === best.weightKg && set.setNumber < best.setNumber)
    ) {
      bestByExercise.set(set.exerciseId, set);
    }
  }

  const events: PrEvent[] = [];
  for (const [exerciseId, best] of bestByExercise) {
    const previousMax = previousMaxByExercise.get(exerciseId);
    if (previousMax === undefined || best.weightKg > previousMax) {
      events.push({ exerciseId, setId: best.id, weightKg: best.weightKg });
    }
  }
  return events;
}
