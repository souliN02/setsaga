import { addDaysToKey, daysBetween, startOfWeekKey, toLocalDateKey } from '@/lib/dates';

// Timestamps are built from local-time components so expectations hold in any
// timezone the test runner happens to use.
function localMs(
  year: number,
  month: number, // 1-based, unlike the Date constructor
  day: number,
  hour = 12,
  minute = 0,
  second = 0,
  ms = 0,
): number {
  return new Date(year, month - 1, day, hour, minute, second, ms).getTime();
}

describe('toLocalDateKey', () => {
  it('formats a timestamp as a local YYYY-MM-DD key', () => {
    expect(toLocalDateKey(localMs(2026, 7, 9))).toBe('2026-07-09');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toLocalDateKey(localMs(2026, 3, 5))).toBe('2026-03-05');
    expect(toLocalDateKey(localMs(2026, 11, 30))).toBe('2026-11-30');
  });

  it('uses the local midnight boundary, not UTC', () => {
    expect(toLocalDateKey(localMs(2026, 1, 31, 23, 59, 59, 999))).toBe('2026-01-31');
    expect(toLocalDateKey(localMs(2026, 2, 1, 0, 0, 0, 0))).toBe('2026-02-01');
  });
});

describe('daysBetween', () => {
  it('returns 0 for the same day', () => {
    expect(daysBetween('2026-01-05', '2026-01-05')).toBe(0);
  });

  it('counts calendar days forward', () => {
    expect(daysBetween('2026-01-05', '2026-01-06')).toBe(1);
    expect(daysBetween('2026-01-05', '2026-01-07')).toBe(2);
  });

  it('is signed: a later from-key gives a negative result', () => {
    expect(daysBetween('2026-01-07', '2026-01-05')).toBe(-2);
  });

  it('crosses month boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetween('2026-04-30', '2026-05-02')).toBe(2);
  });

  it('crosses year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
    expect(daysBetween('2025-12-30', '2026-01-02')).toBe(3);
  });

  it('handles leap and non-leap February', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2); // 2024 is a leap year
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('spans long ranges exactly (no DST drift)', () => {
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });
});

// Weeks start on Monday ("this week" on Home covers Mon–Sun).
describe('startOfWeekKey', () => {
  it('returns the Monday of a mid-week date', () => {
    expect(startOfWeekKey('2026-07-09')).toBe('2026-07-06'); // Thursday → Monday
  });

  it('is a fixed point on Mondays', () => {
    expect(startOfWeekKey('2026-07-06')).toBe('2026-07-06');
  });

  it('keeps Sunday in the week started by the previous Monday', () => {
    expect(startOfWeekKey('2026-07-12')).toBe('2026-07-06');
  });

  it('crosses month boundaries', () => {
    expect(startOfWeekKey('2026-07-01')).toBe('2026-06-29'); // Wednesday → Monday in June
  });

  it('crosses year boundaries', () => {
    expect(startOfWeekKey('2026-01-01')).toBe('2025-12-29'); // Thursday → Monday in 2025
  });
});

describe('addDaysToKey', () => {
  it('adds days within a month', () => {
    expect(addDaysToKey('2026-07-06', 3)).toBe('2026-07-09');
  });

  it('is an identity for 0 days', () => {
    expect(addDaysToKey('2026-07-06', 0)).toBe('2026-07-06');
  });

  it('subtracts days with a negative count', () => {
    expect(addDaysToKey('2026-07-06', -7)).toBe('2026-06-29');
  });

  it('crosses month boundaries forward', () => {
    expect(addDaysToKey('2026-06-29', 7)).toBe('2026-07-06');
  });

  it('crosses year boundaries backward', () => {
    expect(addDaysToKey('2026-01-05', -7)).toBe('2025-12-29');
  });

  it('handles leap-year February', () => {
    expect(addDaysToKey('2024-02-26', 7)).toBe('2024-03-04');
    expect(addDaysToKey('2026-02-23', 7)).toBe('2026-03-02');
  });

  it('inverts daysBetween: stepping by the measured gap lands on the target', () => {
    expect(addDaysToKey('2025-12-29', daysBetween('2025-12-29', '2026-07-06'))).toBe('2026-07-06');
  });
});
