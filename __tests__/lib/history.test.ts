import { weeklyVolumeBuckets } from '@/lib/history';

// Timestamps are built from local-time components so expectations hold in any
// timezone the test runner happens to use (same helper as dates.test.ts).
function localMs(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour).getTime();
}

// todayKey used throughout: Thursday 2026-07-09 → current week starts Monday 2026-07-06.
const TODAY = '2026-07-09';

describe('weeklyVolumeBuckets', () => {
  it('returns weekCount zero-filled buckets for no workouts, ending at the current week', () => {
    const buckets = weeklyVolumeBuckets([], TODAY);
    expect(buckets).toHaveLength(8);
    expect(buckets[7].weekStartKey).toBe('2026-07-06');
    expect(buckets[0].weekStartKey).toBe('2026-05-18');
    for (const bucket of buckets) {
      expect(bucket.volumeKg).toBe(0);
    }
  });

  it('produces a continuous Monday-start run, oldest first', () => {
    const buckets = weeklyVolumeBuckets([], TODAY, 4);
    expect(buckets.map((bucket) => bucket.weekStartKey)).toEqual([
      '2026-06-15',
      '2026-06-22',
      '2026-06-29',
      '2026-07-06',
    ]);
  });

  it('puts a workout in the bucket of its local week', () => {
    const buckets = weeklyVolumeBuckets(
      [{ startedAt: localMs(2026, 7, 7), volumeKg: 1200 }],
      TODAY,
      4,
    );
    expect(buckets[3]).toEqual({ weekStartKey: '2026-07-06', volumeKg: 1200 });
    expect(buckets[2].volumeKg).toBe(0);
  });

  it('sums multiple workouts within the same week', () => {
    const buckets = weeklyVolumeBuckets(
      [
        { startedAt: localMs(2026, 7, 6), volumeKg: 1000 },
        { startedAt: localMs(2026, 7, 8), volumeKg: 500 },
      ],
      TODAY,
      2,
    );
    expect(buckets[1].volumeKg).toBe(1500);
  });

  it('keeps Sunday in the week started by the previous Monday', () => {
    // Sunday 2026-07-12 belongs to the 2026-07-06 week, not a new one.
    const buckets = weeklyVolumeBuckets(
      [
        { startedAt: localMs(2026, 7, 6), volumeKg: 100 },
        { startedAt: localMs(2026, 7, 12), volumeKg: 200 },
      ],
      '2026-07-12',
      2,
    );
    expect(buckets[1]).toEqual({ weekStartKey: '2026-07-06', volumeKg: 300 });
  });

  it('zero-fills skipped weeks between workouts', () => {
    const buckets = weeklyVolumeBuckets(
      [
        { startedAt: localMs(2026, 6, 23), volumeKg: 800 }, // week of 2026-06-22
        { startedAt: localMs(2026, 7, 7), volumeKg: 900 }, // week of 2026-07-06
      ],
      TODAY,
      4,
    );
    expect(buckets.map((bucket) => bucket.volumeKg)).toEqual([0, 800, 0, 900]);
  });

  it('ignores workouts older than the window', () => {
    const buckets = weeklyVolumeBuckets(
      [{ startedAt: localMs(2026, 1, 5), volumeKg: 5000 }],
      TODAY,
      4,
    );
    for (const bucket of buckets) {
      expect(bucket.volumeKg).toBe(0);
    }
  });

  it('spans month and year boundaries continuously', () => {
    const buckets = weeklyVolumeBuckets([], '2026-01-01', 3);
    expect(buckets.map((bucket) => bucket.weekStartKey)).toEqual([
      '2025-12-15',
      '2025-12-22',
      '2025-12-29',
    ]);
  });

  it('is independent of input row order', () => {
    const rows = [
      { startedAt: localMs(2026, 7, 7), volumeKg: 900 },
      { startedAt: localMs(2026, 6, 23), volumeKg: 800 },
    ];
    expect(weeklyVolumeBuckets(rows, TODAY, 4)).toEqual(
      weeklyVolumeBuckets([...rows].reverse(), TODAY, 4),
    );
  });
});
