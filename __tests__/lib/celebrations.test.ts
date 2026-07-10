import { buildCelebrationToasts } from '@/lib/celebrations';

// The finish-workout celebration order is fixed by SPEC.md section 4:
// PRs first, then level-up, then badges.

type FinishResult = Parameters<typeof buildCelebrationToasts>[0];

function makeResult(overrides: Partial<FinishResult> = {}): FinishResult {
  return {
    prEvents: [],
    unlockedBadgeIds: [],
    levelBefore: 3,
    levelAfter: 3,
    ...overrides,
  };
}

const names = new Map([
  [3, 'Bench Press'],
  [8, 'Back Squat'],
]);

describe('buildCelebrationToasts', () => {
  it('returns nothing for an uneventful workout', () => {
    expect(buildCelebrationToasts(makeResult(), names)).toEqual([]);
  });

  it('announces a PR with the exercise name and formatted weight', () => {
    const toasts = buildCelebrationToasts(
      makeResult({ prEvents: [{ exerciseId: 3, setId: 9, weightKg: 82.5 }] }),
      names,
    );
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('pr');
    expect(toasts[0].detail).toBe('Bench Press — 82.5 kg');
  });

  it('still announces a PR when the exercise name is missing', () => {
    const toasts = buildCelebrationToasts(
      makeResult({ prEvents: [{ exerciseId: 99, setId: 1, weightKg: 40 }] }),
      names,
    );
    expect(toasts).toHaveLength(1);
    expect(toasts[0].detail).toContain('40 kg');
  });

  it('announces a level-up only when the level increased', () => {
    expect(buildCelebrationToasts(makeResult({ levelBefore: 4, levelAfter: 4 }), names)).toEqual([]);
    const toasts = buildCelebrationToasts(makeResult({ levelBefore: 4, levelAfter: 5 }), names);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('levelUp');
    expect(toasts[0].detail).toContain('level 5');
  });

  it('announces unlocked badges by display name', () => {
    const toasts = buildCelebrationToasts(makeResult({ unlockedBadgeIds: ['streak_7'] }), names);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].kind).toBe('badge');
    expect(toasts[0].detail).toContain('On Fire');
  });

  it('silently skips badge ids that no longer exist', () => {
    expect(buildCelebrationToasts(makeResult({ unlockedBadgeIds: ['retired_badge'] }), names)).toEqual(
      [],
    );
  });

  it('orders a big finish as PRs, then level-up, then badges', () => {
    const toasts = buildCelebrationToasts(
      makeResult({
        prEvents: [
          { exerciseId: 3, setId: 9, weightKg: 82.5 },
          { exerciseId: 8, setId: 12, weightKg: 140 },
        ],
        levelBefore: 4,
        levelAfter: 5,
        unlockedBadgeIds: ['first_pr', 'session_volume_5k'],
      }),
      names,
    );
    expect(toasts.map((toast) => toast.kind)).toEqual(['pr', 'pr', 'levelUp', 'badge', 'badge']);
  });

  it('gives every toast in a batch a unique id', () => {
    const toasts = buildCelebrationToasts(
      makeResult({
        prEvents: [
          { exerciseId: 3, setId: 9, weightKg: 82.5 },
          { exerciseId: 8, setId: 12, weightKg: 140 },
        ],
        levelBefore: 4,
        levelAfter: 5,
        unlockedBadgeIds: ['first_pr', 'pr_10'],
      }),
      names,
    );
    expect(new Set(toasts.map((toast) => toast.id)).size).toBe(toasts.length);
  });
});
