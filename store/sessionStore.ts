import { create } from 'zustand';

// Transient session state only (CLAUDE.md conventions). The DB owns everything
// durable: the workout row, its sets, startedAt. This store never needs
// persistence — crash recovery rebuilds it from the finishedAt IS NULL row.

type SessionState = {
  activeWorkoutId: number | null;
  // Ordered exerciseIds for the current session, including exercises with no
  // sets yet. Zero-set entries are transient by design: lost on crash, rebuilt
  // from sets (deriveExerciseOrder) on resume.
  exerciseOrder: number[];
  startSession: (workoutId: number) => void;
  resumeSession: (workoutId: number, exerciseOrder: number[]) => void;
  addExerciseToSession: (exerciseId: number) => void;
  endSession: () => void;
};

export const useSessionStore = create<SessionState>()((set) => ({
  activeWorkoutId: null,
  exerciseOrder: [],
  startSession: (workoutId) => set({ activeWorkoutId: workoutId, exerciseOrder: [] }),
  resumeSession: (workoutId, exerciseOrder) => set({ activeWorkoutId: workoutId, exerciseOrder }),
  addExerciseToSession: (exerciseId) =>
    set((state) =>
      state.exerciseOrder.includes(exerciseId)
        ? state
        : { exerciseOrder: [...state.exerciseOrder, exerciseId] },
    ),
  endSession: () => set({ activeWorkoutId: null, exerciseOrder: [] }),
}));
