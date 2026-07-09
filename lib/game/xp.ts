// XP rules and level curve per SPEC.md sections 8.1–8.2. Pure functions only:
// total XP is derived from counts on demand, never stored or incremented, so
// it can never drift out of sync with the underlying data (section 4).

export const XP_PER_SET = 10;
export const XP_PER_WORKOUT = 50;
export const XP_PER_PR = 25;

export interface XpCounts {
  /** Sets inside finished workouts. */
  sets: number;
  /** Finished workouts (finishedAt stamped and ≥ 1 set). */
  workouts: number;
  /** PR events — one per isPr-flagged set. */
  prEvents: number;
}

export function totalXp(counts: XpCounts): number {
  return XP_PER_SET * counts.sets + XP_PER_WORKOUT * counts.workouts + XP_PER_PR * counts.prEvents;
}

/** Cumulative XP required to reach a level: 50·L·(L−1). */
export function totalXpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

/** The largest level whose cumulative requirement is ≤ xp. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

/** Progress-bar numbers: XP into the current level over XP needed for the next. */
export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const levelFloor = totalXpForLevel(level);
  return {
    level,
    xpIntoLevel: xp - levelFloor,
    xpForNextLevel: totalXpForLevel(level + 1) - levelFloor,
  };
}
