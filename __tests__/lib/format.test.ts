import {
  formatCompactCount,
  formatCount,
  formatDate,
  formatDateKey,
  formatDuration,
  formatShortDate,
  formatVolume,
  formatWeight,
} from '@/lib/format';

describe('formatWeight', () => {
  it('formats whole and decimal kilograms', () => {
    expect(formatWeight(60)).toBe('60 kg');
    expect(formatWeight(62.5)).toBe('62.5 kg');
    expect(formatWeight(0)).toBe('0 kg');
  });

  it('rounds float noise to two decimals', () => {
    expect(formatWeight(62.500000001)).toBe('62.5 kg');
  });
});

describe('formatDuration', () => {
  it('formats sub-minute durations', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(7_000)).toBe('0:07');
  });

  it('formats minutes and rolls over to hours', () => {
    expect(formatDuration(45 * 60_000 + 12_000)).toBe('45:12');
    expect(formatDuration(59 * 60_000 + 59_000)).toBe('59:59');
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_600_000 + 23 * 60_000 + 45_000)).toBe('1:23:45');
  });

  it('clamps negative input to zero', () => {
    expect(formatDuration(-5_000)).toBe('0:00');
  });
});

describe('formatCount', () => {
  it('groups thousands in plain counts (badge progress targets)', () => {
    expect(formatCount(499)).toBe('499');
    expect(formatCount(5000)).toBe('5,000');
    expect(formatCount(100000)).toBe('100,000');
    expect(formatCount(1234567)).toBe('1,234,567');
  });
});

// Volume totals get large fast (100,000 kg lifetime badge) — whole kg with
// thousands grouping keeps them readable.
describe('formatVolume', () => {
  it('formats small totals without grouping', () => {
    expect(formatVolume(0)).toBe('0 kg');
    expect(formatVolume(999)).toBe('999 kg');
  });

  it('rounds to whole kilograms', () => {
    expect(formatVolume(1234.6)).toBe('1,235 kg');
  });

  it('groups thousands', () => {
    expect(formatVolume(5000)).toBe('5,000 kg');
    expect(formatVolume(123456)).toBe('123,456 kg');
  });
});

describe('formatDate', () => {
  it('formats a unix-ms timestamp as a short local date', () => {
    // Built from local-time components so the expectation holds in any timezone.
    expect(formatDate(new Date(2026, 2, 12, 12).getTime())).toBe('Mar 12, 2026');
  });

  it('covers month names at year boundaries', () => {
    expect(formatDate(new Date(2025, 11, 31, 12).getTime())).toBe('Dec 31, 2025');
    expect(formatDate(new Date(2026, 0, 1, 12).getTime())).toBe('Jan 1, 2026');
  });
});

describe('formatShortDate', () => {
  it('drops the year for chart axis labels', () => {
    expect(formatShortDate(new Date(2026, 2, 12, 12).getTime())).toBe('Mar 12');
    expect(formatShortDate(new Date(2026, 0, 1, 12).getTime())).toBe('Jan 1');
  });
});

describe('formatDateKey', () => {
  it('formats a date key as a yearless label', () => {
    expect(formatDateKey('2026-06-22')).toBe('Jun 22');
    expect(formatDateKey('2025-12-29')).toBe('Dec 29');
    expect(formatDateKey('2026-01-05')).toBe('Jan 5');
  });
});

describe('formatCompactCount', () => {
  it('leaves sub-thousand counts alone', () => {
    expect(formatCompactCount(0)).toBe('0');
    expect(formatCompactCount(850)).toBe('850');
  });

  it('abbreviates thousands to one decimal', () => {
    expect(formatCompactCount(1234)).toBe('1.2k');
    expect(formatCompactCount(5000)).toBe('5k');
    expect(formatCompactCount(20000)).toBe('20k');
  });
});
