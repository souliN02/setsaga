import * as Haptics from 'expo-haptics';

// Haptics are fire-and-forget decoration: a device without a vibrator (or
// web) must never turn feedback into an unhandled rejection.
function fire(call: () => Promise<void>): void {
  call().catch(() => {});
}

/** Light tick when a set is logged. */
export function hapticSetComplete(): void {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Success buzz when a celebration toast (PR / level-up / badge) appears. */
export function hapticCelebration(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}
