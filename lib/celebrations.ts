// Maps a finish-workout pipeline result to the celebration toast sequence.
// Order is fixed by SPEC.md section 4: PRs, then level-up, then badges.
// Pure module — the type-only import keeps the DB out of the bundle graph.

import type { FinishWorkoutResult } from '@/lib/db/queries';
import { formatWeight } from '@/lib/format';
import { getBadge } from '@/lib/game/badges';

export type CelebrationKind = 'pr' | 'levelUp' | 'badge';

export interface CelebrationToast {
  id: string;
  kind: CelebrationKind;
  title: string;
  detail: string;
}

export function buildCelebrationToasts(
  result: FinishWorkoutResult,
  exerciseNameById: ReadonlyMap<number, string>,
): CelebrationToast[] {
  const toasts: CelebrationToast[] = [];

  for (const pr of result.prEvents) {
    const name = exerciseNameById.get(pr.exerciseId) ?? 'Unknown exercise';
    toasts.push({
      id: `pr-${pr.setId}`,
      kind: 'pr',
      title: 'New PR!',
      detail: `${name} — ${formatWeight(pr.weightKg)}`,
    });
  }

  if (result.levelAfter > result.levelBefore) {
    toasts.push({
      id: `level-${result.levelAfter}`,
      kind: 'levelUp',
      title: 'Level up!',
      detail: `You reached level ${result.levelAfter}`,
    });
  }

  for (const badgeId of result.unlockedBadgeIds) {
    const badge = getBadge(badgeId);
    if (!badge) continue; // an unlock row from a retired badge id
    toasts.push({
      id: `badge-${badgeId}`,
      kind: 'badge',
      title: 'Badge unlocked',
      detail: `${badge.name} — ${badge.description}`,
    });
  }

  return toasts;
}
