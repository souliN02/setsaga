import exercisesJson from '@/data/exercises.json';
import { prepareSeedRows } from '@/lib/db/seed';

describe('prepareSeedRows', () => {
  it('accepts the real exercises.json and marks every row non-custom', () => {
    const rows = prepareSeedRows(exercisesJson);
    expect(rows).toHaveLength(exercisesJson.length);
    for (const row of rows) {
      expect(row.isCustom).toBe(false);
    }
  });

  it('trims exercise names', () => {
    const rows = prepareSeedRows([
      { name: '  Bench Press  ', muscleGroup: 'chest', equipment: 'barbell' },
    ]);
    expect(rows[0].name).toBe('Bench Press');
  });

  it('rejects non-array input', () => {
    expect(() => prepareSeedRows({ name: 'Bench Press' })).toThrow('expected an array');
  });

  it('rejects entries with a missing or empty name', () => {
    expect(() => prepareSeedRows([{ muscleGroup: 'chest', equipment: 'barbell' }])).toThrow(
      'missing or empty name',
    );
    expect(() =>
      prepareSeedRows([{ name: '   ', muscleGroup: 'chest', equipment: 'barbell' }]),
    ).toThrow('missing or empty name');
  });

  it('rejects invalid muscle groups', () => {
    expect(() =>
      prepareSeedRows([{ name: 'Bench Press', muscleGroup: 'pecs', equipment: 'barbell' }]),
    ).toThrow('invalid muscleGroup');
  });

  it('rejects invalid equipment', () => {
    expect(() =>
      prepareSeedRows([{ name: 'Bench Press', muscleGroup: 'chest', equipment: 'bands' }]),
    ).toThrow('invalid equipment');
  });
});
