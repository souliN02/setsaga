import { formatDuration, formatWeight } from '@/lib/format';

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
