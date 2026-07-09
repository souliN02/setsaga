import { currentStreak, isStreakAtRisk } from '@/lib/game/streak';

// SPEC.md 8.3 — streaks operate on local date keys, never raw timestamps.
// A training day = a local date with ≥ 1 finished workout. Two training days
// chain when ≤ 2 calendar days apart (at most one full rest day between them).

describe('currentStreak', () => {
  it('is 0 with no training days', () => {
    expect(currentStreak([], '2026-07-09')).toBe(0);
  });

  it('is 1 after training today for the first time', () => {
    expect(currentStreak(['2026-07-09'], '2026-07-09')).toBe(1);
  });

  it('counts consecutive days (spec example: Mon+Tue+Wed → 3)', () => {
    expect(currentStreak(['2026-07-06', '2026-07-07', '2026-07-08'], '2026-07-08')).toBe(3);
  });

  it('allows one rest day between training days (spec example: Mon+Wed+Fri → 3)', () => {
    expect(currentStreak(['2026-07-06', '2026-07-08', '2026-07-10'], '2026-07-10')).toBe(3);
  });

  it('breaks the chain after two rest days (spec example: Mon then Thu → 1)', () => {
    expect(currentStreak(['2026-07-06', '2026-07-09'], '2026-07-09')).toBe(1);
  });

  it('stays alive when the last training day was yesterday', () => {
    expect(currentStreak(['2026-07-07', '2026-07-08'], '2026-07-09')).toBe(2);
  });

  it('stays alive when the last training day was the day before yesterday', () => {
    expect(currentStreak(['2026-07-06', '2026-07-07'], '2026-07-09')).toBe(2);
  });

  it('is 0 when the last training day is more than 2 days ago', () => {
    expect(currentStreak(['2026-07-01', '2026-07-02', '2026-07-03'], '2026-07-09')).toBe(0);
  });

  it('only counts the chain containing the most recent training day', () => {
    // 1st–2nd, then a 4-day gap, then 6th–7th: only the recent chain counts.
    expect(
      currentStreak(['2026-07-01', '2026-07-02', '2026-07-06', '2026-07-07'], '2026-07-07'),
    ).toBe(2);
  });

  it('counts a day with multiple workouts once', () => {
    expect(currentStreak(['2026-07-08', '2026-07-08', '2026-07-09'], '2026-07-09')).toBe(2);
  });

  it('does not depend on input order', () => {
    expect(currentStreak(['2026-07-09', '2026-07-07', '2026-07-08'], '2026-07-09')).toBe(3);
  });

  it('chains across a month boundary', () => {
    expect(currentStreak(['2026-01-31', '2026-02-01'], '2026-02-01')).toBe(2);
    expect(currentStreak(['2026-01-30', '2026-02-01'], '2026-02-01')).toBe(2); // one rest day
  });

  it('chains across a year boundary', () => {
    expect(currentStreak(['2025-12-31', '2026-01-01'], '2026-01-01')).toBe(2);
    expect(currentStreak(['2025-12-30', '2026-01-01'], '2026-01-01')).toBe(2);
  });

  it('respects leap-year February when measuring gaps', () => {
    // Leap year: Feb 28 → Mar 1 is a 2-day gap (Feb 29 between) — still chains.
    expect(currentStreak(['2024-02-28', '2024-03-01'], '2024-03-01')).toBe(2);
    // Leap year: Feb 27 → Mar 1 is a 3-day gap — chain broken.
    expect(currentStreak(['2024-02-27', '2024-03-01'], '2024-03-01')).toBe(1);
    // Non-leap year: Feb 27 → Mar 1 is only 2 days — still chains.
    expect(currentStreak(['2026-02-27', '2026-03-01'], '2026-03-01')).toBe(2);
  });
});

// SPEC.md 8.3 — at risk exactly when today − lastTrainingDay = 2.
describe('isStreakAtRisk', () => {
  it('is false with no training days', () => {
    expect(isStreakAtRisk([], '2026-07-09')).toBe(false);
  });

  it('is false when trained today', () => {
    expect(isStreakAtRisk(['2026-07-09'], '2026-07-09')).toBe(false);
  });

  it('is false when trained yesterday', () => {
    expect(isStreakAtRisk(['2026-07-08'], '2026-07-09')).toBe(false);
  });

  it('is true when last trained exactly 2 days ago (spec: at risk until tonight)', () => {
    expect(isStreakAtRisk(['2026-07-07'], '2026-07-09')).toBe(true);
  });

  it('is false once the streak is already dead (3+ days ago)', () => {
    expect(isStreakAtRisk(['2026-07-06'], '2026-07-09')).toBe(false);
  });

  it('flags a multi-day streak that is about to expire', () => {
    expect(isStreakAtRisk(['2026-07-05', '2026-07-06', '2026-07-07'], '2026-07-09')).toBe(true);
  });

  it('handles the 2-day boundary across a month edge', () => {
    expect(isStreakAtRisk(['2026-06-30'], '2026-07-02')).toBe(true);
    expect(isStreakAtRisk(['2026-06-30'], '2026-07-03')).toBe(false);
  });
});
