import { FlatList, StyleSheet, Text } from 'react-native';

import { BadgeCard } from '@/components/BadgeCard';
import { useAchievements, useGameStats } from '@/lib/db/queries';
import { BADGES, type Badge } from '@/lib/game/badges';
import { colors } from '@/lib/theme';
import { useTodayKey } from '@/lib/useTodayKey';

// All 12 badges are always on the grid — locked ones greyed with progress
// toward the criterion — so there is no empty state to design here.
export default function AchievementsScreen() {
  const todayKey = useTodayKey();
  const stats = useGameStats(todayKey);
  const { data: unlockRows } = useAchievements();
  const unlockedAtById = new Map(unlockRows.map((row) => [row.badgeId, row.unlockedAt]));

  return (
    <FlatList<Badge>
      style={styles.container}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.column}
      numColumns={2}
      data={[...BADGES]}
      keyExtractor={(badge) => badge.id}
      ListHeaderComponent={
        <Text style={styles.summary}>
          {unlockRows.length} of {BADGES.length} unlocked
        </Text>
      }
      renderItem={({ item: badge }) => (
        <BadgeCard badge={badge} unlockedAt={unlockedAtById.get(badge.id) ?? null} stats={stats} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  column: {
    gap: 16,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
