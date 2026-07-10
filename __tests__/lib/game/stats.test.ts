import { deriveGameStats, type GameStatRow } from '@/lib/game/stats';

// deriveGameStats is the single derivation both the post-workout pipeline and
// the Home/Achievements screens use — rows in, BadgeStats + week snapshot out.
// Input rows are always sets of finished workouts (the query enforces that).

// Timestamps built from local-time components so expectations hold in any
// timezone the test runner happens to use (same pattern as dates.test.ts).
function localMs(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour).getTime();
}

function row(overrides: Partial<GameStatRow> = {}): GameStatRow {
  return {
    workoutId: 1,
    startedAt: localMs(2026, 7, 6),
    reps: 10,
    weightKg: 50,
    isPr: false,
    ...overrides,
  };
}

// 2026-07-09 is a Thursday; its week runs Mon 2026-07-06 – Sun 2026-07-12.
const TODAY = '2026-07-09';

describe('deriveGameStats', () => {
  it('returns all-zero stats for a fresh install', () => {
    expect(deriveGameStats([], TODAY)).toEqual({
      finishedWorkouts: 0,
      lifetimeSets: 0,
      prEvents: 0,
      currentStreak: 0,
      maxSessionVolume: 0,
      lifetimeVolume: 0,
      streakAtRisk: false,
      weekWorkouts: 0,
      weekVolumeKg: 0,
    });
  });

  it('counts distinct workouts and total sets', () => {
    const stats = deriveGameStats(
      [row({ workoutId: 1 }), row({ workoutId: 1 }), row({ workoutId: 2 })],
      TODAY,
    );
    expect(stats.finishedWorkouts).toBe(2);
    expect(stats.lifetimeSets).toBe(3);
  });

  it('sums volume as weight × reps, lifetime and per-session max', () => {
    const stats = deriveGameStats(
      [
        row({ workoutId: 1, weightKg: 100, reps: 5 }),
        row({ workoutId: 1, weightKg: 100, reps: 5 }),
        row({ workoutId: 2, weightKg: 60, reps: 10 }),
      ],
      TODAY,
    );
    expect(stats.lifetimeVolume).toBe(1600);
    expect(stats.maxSessionVolume).toBe(1000);
  });

  it('gives bodyweight sets (0 kg) zero volume but still counts them as sets', () => {
    const stats = deriveGameStats([row({ weightKg: 0, reps: 15 })], TODAY);
    expect(stats.lifetimeSets).toBe(1);
    expect(stats.lifetimeVolume).toBe(0);
  });

  it('counts one PR event per isPr-flagged set', () => {
    const stats = deriveGameStats(
      [row({ isPr: true }), row({ isPr: false }), row({ workoutId: 2, isPr: true })],
      TODAY,
    );
    expect(stats.prEvents).toBe(2);
  });

  describe('streak', () => {
    it('chains consecutive training days and is not at risk after training today', () => {
      const stats = deriveGameStats(
        [
          row({ workoutId: 1, startedAt: localMs(2026, 7, 7) }),
          row({ workoutId: 2, startedAt: localMs(2026, 7, 8) }),
          row({ workoutId: 3, startedAt: localMs(2026, 7, 9) }),
        ],
        TODAY,
      );
      expect(stats.currentStreak).toBe(3);
      expect(stats.streakAtRisk).toBe(false);
    });

    it('counts two workouts on the same day as one training day', () => {
      const stats = deriveGameStats(
        [
          row({ workoutId: 1, startedAt: localMs(2026, 7, 9, 8) }),
          row({ workoutId: 2, startedAt: localMs(2026, 7, 9, 18) }),
        ],
        TODAY,
      );
      expect(stats.currentStreak).toBe(1);
    });

    it('flags the streak at risk when the last training day was 2 days ago', () => {
      const stats = deriveGameStats([row({ startedAt: localMs(2026, 7, 7) })], TODAY);
      expect(stats.currentStreak).toBe(1);
      expect(stats.streakAtRisk).toBe(true);
    });

    it('reports 0 once the last training day is more than 2 days back', () => {
      const stats = deriveGameStats([row({ startedAt: localMs(2026, 7, 5) })], TODAY);
      expect(stats.currentStreak).toBe(0);
      expect(stats.streakAtRisk).toBe(false);
    });
  });

  describe('this week (Mon–Sun containing today)', () => {
    it('counts workouts and volume from this week only', () => {
      const stats = deriveGameStats(
        [
          // Sunday 2026-07-05: previous week.
          row({ workoutId: 1, startedAt: localMs(2026, 7, 5), weightKg: 100, reps: 10 }),
          // Monday and Thursday: this week.
          row({ workoutId: 2, startedAt: localMs(2026, 7, 6), weightKg: 80, reps: 5 }),
          row({ workoutId: 3, startedAt: localMs(2026, 7, 9), weightKg: 60, reps: 10 }),
        ],
        TODAY,
      );
      expect(stats.weekWorkouts).toBe(2);
      expect(stats.weekVolumeKg).toBe(1000);
    });

    it('still counts Monday when today is Sunday', () => {
      const stats = deriveGameStats(
        [row({ workoutId: 1, startedAt: localMs(2026, 7, 6) })],
        '2026-07-12',
      );
      expect(stats.weekWorkouts).toBe(1);
    });
  });
});
