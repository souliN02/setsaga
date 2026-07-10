import { parseRouteId } from '@/lib/routeParams';

describe('parseRouteId', () => {
  it('parses a positive integer segment', () => {
    expect(parseRouteId('7')).toBe(7);
    expect(parseRouteId('123')).toBe(123);
  });

  it('takes the first value of an array param', () => {
    expect(parseRouteId(['7', '9'])).toBe(7);
  });

  it('rejects missing, non-numeric, negative, and zero ids', () => {
    expect(parseRouteId(undefined)).toBeNull();
    expect(parseRouteId('')).toBeNull();
    expect(parseRouteId('abc')).toBeNull();
    expect(parseRouteId('1.5')).toBeNull();
    expect(parseRouteId('-3')).toBeNull();
    expect(parseRouteId('0')).toBeNull();
  });
});
