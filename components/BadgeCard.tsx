import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCount, formatDate } from '@/lib/format';
import type { Badge, BadgeStats } from '@/lib/game/badges';
import { colors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const BADGE_ICONS: Record<string, IconName> = {
  first_workout: 'barbell',
  workouts_10: 'calendar',
  workouts_50: 'fitness',
  workouts_100: 'shield-checkmark',
  streak_3: 'flame',
  streak_7: 'flame',
  streak_14: 'flame',
  first_pr: 'trending-up',
  pr_10: 'podium',
  session_volume_5k: 'flash',
  lifetime_volume_100k: 'earth',
  sets_500: 'layers',
};

type Props = {
  badge: Badge;
  /** Unlock timestamp from the achievements table, or null while locked. */
  unlockedAt: number | null;
  stats: BadgeStats;
};

export function BadgeCard({ badge, unlockedAt, stats }: Props) {
  const unlocked = unlockedAt !== null;
  const { current, target } = badge.progress(stats);
  const ratio = Math.min(Math.max(current / target, 0), 1);
  // Floor so a locked volume badge never displays as "5,000 / 5,000".
  const shownCurrent = Math.min(Math.floor(current), target);

  return (
    <View style={[styles.card, unlocked ? styles.cardUnlocked : styles.cardLocked]}>
      <Ionicons
        name={BADGE_ICONS[badge.id] ?? 'ribbon'}
        size={30}
        color={unlocked ? colors.primary : colors.textSecondary}
      />
      <Text style={styles.name}>{badge.name}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {badge.description}
      </Text>
      {unlocked ? (
        <Text style={styles.unlockedAt}>Unlocked {formatDate(unlockedAt)}</Text>
      ) : (
        <View style={styles.progressBlock}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {formatCount(shownCurrent)} / {formatCount(target)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardUnlocked: {
    borderColor: colors.primary,
  },
  cardLocked: {
    opacity: 0.75,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  unlockedAt: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  progressBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  track: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});
