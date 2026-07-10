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

export interface BadgeProgress {
  current: number;
  target: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  isUnlocked: (stats: BadgeStats) => boolean;
  /** Display-only progress toward the criterion (locked badges on the grid). */
  progress: (stats: BadgeStats) => BadgeProgress;
}

// Every badge is a threshold on a single stat, so the threshold is defined
// once and the unlock rule and progress display can never disagree.
function thresholdBadge(
  id: string,
  name: string,
  description: string,
  stat: keyof BadgeStats,
  target: number,
): Badge {
  return {
    id,
    name,
    description,
    isUnlocked: (stats) => stats[stat] >= target,
    progress: (stats) => ({ current: stats[stat], target }),
  };
}

export const BADGES: readonly Badge[] = [
  thresholdBadge('first_workout', 'First Rep', 'Finish your first workout', 'finishedWorkouts', 1),
  thresholdBadge('workouts_10', 'Regular', 'Finish 10 workouts', 'finishedWorkouts', 10),
  thresholdBadge('workouts_50', 'Gym Rat', 'Finish 50 workouts', 'finishedWorkouts', 50),
  thresholdBadge('workouts_100', 'Iron Veteran', 'Finish 100 workouts', 'finishedWorkouts', 100),
  thresholdBadge('streak_3', 'Warming Up', 'Reach a 3-day streak', 'currentStreak', 3),
  thresholdBadge('streak_7', 'On Fire', 'Reach a 7-day streak', 'currentStreak', 7),
  thresholdBadge('streak_14', 'Unstoppable', 'Reach a 14-day streak', 'currentStreak', 14),
  thresholdBadge('first_pr', 'New Heights', 'Set your first personal record', 'prEvents', 1),
  thresholdBadge('pr_10', 'Record Breaker', 'Set 10 personal records', 'prEvents', 10),
  thresholdBadge(
    'session_volume_5k',
    'Heavy Session',
    'Move 5,000 kg in a single workout',
    'maxSessionVolume',
    5000,
  ),
  thresholdBadge(
    'lifetime_volume_100k',
    'Six Figures',
    'Move 100,000 kg in total',
    'lifetimeVolume',
    100000,
  ),
  thresholdBadge('sets_500', 'Set Machine', 'Log 500 lifetime sets', 'lifetimeSets', 500),
];

const BADGES_BY_ID = new Map(BADGES.map((badge) => [badge.id, badge]));

/** Lookup for unlock rows and celebration toasts, which carry only a badgeId. */
export function getBadge(badgeId: string): Badge | undefined {
  return BADGES_BY_ID.get(badgeId);
}

/** Badges whose criteria are met but have no unlock row yet, in spec order. */
export function newBadgeUnlocks(stats: BadgeStats, alreadyUnlocked: ReadonlySet<string>): Badge[] {
  return BADGES.filter((badge) => !alreadyUnlocked.has(badge.id) && badge.isUnlocked(stats));
}
