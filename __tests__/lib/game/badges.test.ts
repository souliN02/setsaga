import { BADGES, getBadge, newBadgeUnlocks, type BadgeStats } from '@/lib/game/badges';

// SPEC.md 8.5 — 12 badges, derived from stats; unlock rows are written the
// first time a criterion is met and persist forever.

function makeStats(overrides: Partial<BadgeStats> = {}): BadgeStats {
  return {
    finishedWorkouts: 0,
    lifetimeSets: 0,
    prEvents: 0,
    currentStreak: 0,
    maxSessionVolume: 0,
    lifetimeVolume: 0,
    ...overrides,
  };
}

function badge(id: string) {
  const found = BADGES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No badge with id "${id}"`);
  return found;
}

describe('badge definitions', () => {
  it('defines exactly the 12 badge ids from the spec', () => {
    expect(BADGES.map((entry) => entry.id)).toEqual([
      'first_workout',
      'workouts_10',
      'workouts_50',
      'workouts_100',
      'streak_3',
      'streak_7',
      'streak_14',
      'first_pr',
      'pr_10',
      'session_volume_5k',
      'lifetime_volume_100k',
      'sets_500',
    ]);
  });

  it('uses the display names from the spec', () => {
    expect(badge('first_workout').name).toBe('First Rep');
    expect(badge('workouts_10').name).toBe('Regular');
    expect(badge('workouts_50').name).toBe('Gym Rat');
    expect(badge('workouts_100').name).toBe('Iron Veteran');
    expect(badge('streak_3').name).toBe('Warming Up');
    expect(badge('streak_7').name).toBe('On Fire');
    expect(badge('streak_14').name).toBe('Unstoppable');
    expect(badge('first_pr').name).toBe('New Heights');
    expect(badge('pr_10').name).toBe('Record Breaker');
    expect(badge('session_volume_5k').name).toBe('Heavy Session');
    expect(badge('lifetime_volume_100k').name).toBe('Six Figures');
    expect(badge('sets_500').name).toBe('Set Machine');
  });

  it('gives every badge a non-empty description', () => {
    for (const entry of BADGES) {
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});

// Every criterion tested at threshold − 1 and threshold (SPEC.md section 10).
describe('badge criteria', () => {
  it.each([
    ['first_workout', 1],
    ['workouts_10', 10],
    ['workouts_50', 50],
    ['workouts_100', 100],
  ])('%s unlocks at %i finished workouts, not one fewer', (id, threshold) => {
    expect(badge(id).isUnlocked(makeStats({ finishedWorkouts: threshold - 1 }))).toBe(false);
    expect(badge(id).isUnlocked(makeStats({ finishedWorkouts: threshold }))).toBe(true);
  });

  it.each([
    ['streak_3', 3],
    ['streak_7', 7],
    ['streak_14', 14],
  ])('%s unlocks when the streak reaches %i, not one fewer', (id, threshold) => {
    expect(badge(id).isUnlocked(makeStats({ currentStreak: threshold - 1 }))).toBe(false);
    expect(badge(id).isUnlocked(makeStats({ currentStreak: threshold }))).toBe(true);
  });

  it.each([
    ['first_pr', 1],
    ['pr_10', 10],
  ])('%s unlocks at %i PR events, not one fewer', (id, threshold) => {
    expect(badge(id).isUnlocked(makeStats({ prEvents: threshold - 1 }))).toBe(false);
    expect(badge(id).isUnlocked(makeStats({ prEvents: threshold }))).toBe(true);
  });

  it('session_volume_5k unlocks at ≥ 5,000 kg in a single workout', () => {
    expect(badge('session_volume_5k').isUnlocked(makeStats({ maxSessionVolume: 4999.5 }))).toBe(false);
    expect(badge('session_volume_5k').isUnlocked(makeStats({ maxSessionVolume: 5000 }))).toBe(true);
  });

  it('lifetime_volume_100k unlocks at ≥ 100,000 kg lifetime', () => {
    expect(badge('lifetime_volume_100k').isUnlocked(makeStats({ lifetimeVolume: 99999 }))).toBe(false);
    expect(badge('lifetime_volume_100k').isUnlocked(makeStats({ lifetimeVolume: 100000 }))).toBe(true);
  });

  it('sets_500 unlocks at 500 lifetime sets', () => {
    expect(badge('sets_500').isUnlocked(makeStats({ lifetimeSets: 499 }))).toBe(false);
    expect(badge('sets_500').isUnlocked(makeStats({ lifetimeSets: 500 }))).toBe(true);
  });

  it('exceeding a threshold keeps the criterion satisfied', () => {
    expect(badge('workouts_10').isUnlocked(makeStats({ finishedWorkouts: 37 }))).toBe(true);
    expect(badge('streak_3').isUnlocked(makeStats({ currentStreak: 9 }))).toBe(true);
  });
});

// Progress is display-only (locked badges on the Achievements grid); it must
// track the same stat and threshold as the unlock criterion, never a new rule.
describe('badge progress', () => {
  function statsWith(key: keyof BadgeStats, value: number): BadgeStats {
    const stats = makeStats();
    stats[key] = value;
    return stats;
  }

  const tracked: [string, keyof BadgeStats, number][] = [
    ['first_workout', 'finishedWorkouts', 1],
    ['workouts_10', 'finishedWorkouts', 10],
    ['workouts_50', 'finishedWorkouts', 50],
    ['workouts_100', 'finishedWorkouts', 100],
    ['streak_3', 'currentStreak', 3],
    ['streak_7', 'currentStreak', 7],
    ['streak_14', 'currentStreak', 14],
    ['first_pr', 'prEvents', 1],
    ['pr_10', 'prEvents', 10],
    ['session_volume_5k', 'maxSessionVolume', 5000],
    ['lifetime_volume_100k', 'lifetimeVolume', 100000],
    ['sets_500', 'lifetimeSets', 500],
  ];

  it.each(tracked)('%s reports the %s stat against a target of %i', (id, statKey, target) => {
    expect(badge(id).progress(makeStats())).toEqual({ current: 0, target });
    expect(badge(id).progress(statsWith(statKey, 7))).toEqual({ current: 7, target });
  });

  it.each(tracked)('%s unlocks exactly when its progress reaches the target', (id, statKey, target) => {
    expect(badge(id).isUnlocked(statsWith(statKey, target - 1))).toBe(false);
    expect(badge(id).isUnlocked(statsWith(statKey, target))).toBe(true);
  });
});

describe('getBadge', () => {
  it('returns the badge for a known id', () => {
    expect(getBadge('first_pr')?.name).toBe('New Heights');
  });

  it('returns undefined for an unknown id', () => {
    expect(getBadge('not_a_badge')).toBeUndefined();
  });
});

// The pipeline diff: which badges newly unlock given current stats and the
// unlock rows already in the achievements table.
describe('newBadgeUnlocks', () => {
  it('returns nothing for a fresh account with no activity', () => {
    expect(newBadgeUnlocks(makeStats(), new Set())).toEqual([]);
  });

  it('returns a newly satisfied badge exactly once', () => {
    const unlocked = newBadgeUnlocks(makeStats({ finishedWorkouts: 1, currentStreak: 1 }), new Set());
    expect(unlocked.map((entry) => entry.id)).toEqual(['first_workout']);
  });

  it('can unlock several badges from one workout', () => {
    const stats = makeStats({ finishedWorkouts: 10, currentStreak: 3, prEvents: 1 });
    const unlocked = newBadgeUnlocks(stats, new Set(['first_workout']));
    expect(unlocked.map((entry) => entry.id)).toEqual(['workouts_10', 'streak_3', 'first_pr']);
  });

  it('never re-returns badges that are already unlocked', () => {
    const stats = makeStats({ finishedWorkouts: 12 });
    expect(newBadgeUnlocks(stats, new Set(['first_workout', 'workouts_10']))).toEqual([]);
  });

  it('leaves streak badges unlocked after the streak breaks (unlock rows persist)', () => {
    // Streak reached 3 last month (row exists), is 0 now: nothing new, nothing revoked.
    const stats = makeStats({ finishedWorkouts: 20, currentStreak: 0 });
    const unlocked = newBadgeUnlocks(stats, new Set(['first_workout', 'workouts_10', 'streak_3']));
    expect(unlocked).toEqual([]);
  });

  it('returns unlocks in spec order for stable toast ordering', () => {
    const stats = makeStats({
      finishedWorkouts: 1,
      lifetimeSets: 500,
      prEvents: 1,
      maxSessionVolume: 6000,
    });
    expect(newBadgeUnlocks(stats, new Set()).map((entry) => entry.id)).toEqual([
      'first_workout',
      'first_pr',
      'session_volume_5k',
      'sets_500',
    ]);
  });
});
