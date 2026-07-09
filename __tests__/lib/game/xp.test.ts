import {
  levelForXp,
  levelProgress,
  totalXp,
  totalXpForLevel,
  XP_PER_PR,
  XP_PER_SET,
  XP_PER_WORKOUT,
} from '@/lib/game/xp';

// SPEC.md 8.1 — XP: 10 per set, 50 per finished workout, 25 per PR event.
describe('totalXp', () => {
  it('exposes the exact XP constants from the spec', () => {
    expect(XP_PER_SET).toBe(10);
    expect(XP_PER_WORKOUT).toBe(50);
    expect(XP_PER_PR).toBe(25);
  });

  it('is 0 with no activity', () => {
    expect(totalXp({ sets: 0, workouts: 0, prEvents: 0 })).toBe(0);
  });

  it('awards 10 XP per set', () => {
    expect(totalXp({ sets: 3, workouts: 0, prEvents: 0 })).toBe(30);
  });

  it('awards 50 XP per finished workout', () => {
    expect(totalXp({ sets: 0, workouts: 2, prEvents: 0 })).toBe(100);
  });

  it('awards 25 XP per PR event', () => {
    expect(totalXp({ sets: 0, workouts: 0, prEvents: 4 })).toBe(100);
  });

  it('computes 10·sets + 50·workouts + 25·prEvents', () => {
    expect(totalXp({ sets: 12, workouts: 3, prEvents: 2 })).toBe(120 + 150 + 50);
  });

  it('matches the spec pacing check: a 15-set workout is 200 XP', () => {
    expect(totalXp({ sets: 15, workouts: 1, prEvents: 0 })).toBe(200);
  });
});

// SPEC.md 8.2 — totalXpForLevel(L) = 50·L·(L−1).
describe('totalXpForLevel', () => {
  it.each([
    [1, 0],
    [2, 100],
    [3, 300],
    [4, 600],
    [5, 1000],
    [10, 4500],
  ])('level %i requires %i cumulative XP', (level, xp) => {
    expect(totalXpForLevel(level)).toBe(xp);
  });
});

// SPEC.md 8.2 — levelForXp(xp) = largest L with totalXpForLevel(L) ≤ xp.
describe('levelForXp', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(levelForXp(0)).toBe(1);
  });

  it.each([
    [99, 1],
    [100, 2],
    [299, 2],
    [300, 3],
    [599, 3],
    [600, 4],
    [999, 4],
    [1000, 5],
    [4499, 9],
    [4500, 10],
  ])('%i XP is level %i (boundaries are inclusive)', (xp, level) => {
    expect(levelForXp(xp)).toBe(level);
  });

  it('handles XP between boundaries', () => {
    expect(levelForXp(150)).toBe(2);
    expect(levelForXp(4501)).toBe(10);
  });
});

// SPEC.md 8.2 — progress bar: XP into the current level over XP needed for the next.
describe('levelProgress', () => {
  it('reports a fresh account as level 1, 0/100', () => {
    expect(levelProgress(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 });
  });

  it('reports XP into the current level', () => {
    // 150 XP: level 2 starts at 100, level 3 at 300 → 50 into a 200-wide level.
    expect(levelProgress(150)).toEqual({ level: 2, xpIntoLevel: 50, xpForNextLevel: 200 });
  });

  it('resets progress to 0 exactly at a level boundary', () => {
    expect(levelProgress(300)).toEqual({ level: 3, xpIntoLevel: 0, xpForNextLevel: 300 });
  });

  it('widens each level by 100 XP (level L needs 100·L to the next)', () => {
    expect(levelProgress(4500)).toEqual({ level: 10, xpIntoLevel: 0, xpForNextLevel: 1000 });
  });
});
