// Badge definitions per SPEC.md section 8.5. Criteria are pure predicates over
// derived stats; the only stored state is the unlock event row in the
// achievements table, which is why a broken streak never revokes a badge.

export interface BadgeStats {
  finishedWorkouts: number;
  lifetimeSets: number;
  prEvents: number;
  currentStreak: number;
  maxSessionVolume: number;
  lifetimeVolume: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  isUnlocked: (stats: BadgeStats) => boolean;
}

export const BADGES: readonly Badge[] = [
  {
    id: 'first_workout',
    name: 'First Rep',
    description: 'Finish your first workout',
    isUnlocked: (stats) => stats.finishedWorkouts >= 1,
  },
  {
    id: 'workouts_10',
    name: 'Regular',
    description: 'Finish 10 workouts',
    isUnlocked: (stats) => stats.finishedWorkouts >= 10,
  },
  {
    id: 'workouts_50',
    name: 'Gym Rat',
    description: 'Finish 50 workouts',
    isUnlocked: (stats) => stats.finishedWorkouts >= 50,
  },
  {
    id: 'workouts_100',
    name: 'Iron Veteran',
    description: 'Finish 100 workouts',
    isUnlocked: (stats) => stats.finishedWorkouts >= 100,
  },
  {
    id: 'streak_3',
    name: 'Warming Up',
    description: 'Reach a 3-day streak',
    isUnlocked: (stats) => stats.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'On Fire',
    description: 'Reach a 7-day streak',
    isUnlocked: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'streak_14',
    name: 'Unstoppable',
    description: 'Reach a 14-day streak',
    isUnlocked: (stats) => stats.currentStreak >= 14,
  },
  {
    id: 'first_pr',
    name: 'New Heights',
    description: 'Set your first personal record',
    isUnlocked: (stats) => stats.prEvents >= 1,
  },
  {
    id: 'pr_10',
    name: 'Record Breaker',
    description: 'Set 10 personal records',
    isUnlocked: (stats) => stats.prEvents >= 10,
  },
  {
    id: 'session_volume_5k',
    name: 'Heavy Session',
    description: 'Move 5,000 kg in a single workout',
    isUnlocked: (stats) => stats.maxSessionVolume >= 5000,
  },
  {
    id: 'lifetime_volume_100k',
    name: 'Six Figures',
    description: 'Move 100,000 kg in total',
    isUnlocked: (stats) => stats.lifetimeVolume >= 100000,
  },
  {
    id: 'sets_500',
    name: 'Set Machine',
    description: 'Log 500 lifetime sets',
    isUnlocked: (stats) => stats.lifetimeSets >= 500,
  },
];

/** Badges whose criteria are met but have no unlock row yet, in spec order. */
export function newBadgeUnlocks(stats: BadgeStats, alreadyUnlocked: ReadonlySet<string>): Badge[] {
  return BADGES.filter((badge) => !alreadyUnlocked.has(badge.id) && badge.isUnlocked(stats));
}
