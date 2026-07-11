import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { WeeklyVolumeChart } from '@/components/WeeklyVolumeChart';
import { WorkoutSummaryRow } from '@/components/WorkoutSummaryRow';
import { useWorkoutSummaries } from '@/lib/db/queries';
import { weeklyVolumeBuckets } from '@/lib/history';
import { colors } from '@/lib/theme';
import { useTodayKey } from '@/lib/useTodayKey';

export default function HistoryScreen() {
  const todayKey = useTodayKey();
  const { data: summaries } = useWorkoutSummaries();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={summaries}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        // Hidden (not rendered empty) until there is at least one workout, so
        // a fresh install shows only the designed empty state.
        summaries.length > 0 ? (
          <WeeklyVolumeChart buckets={weeklyVolumeBuckets(summaries, todayKey)} />
        ) : null
      }
      renderItem={({ item }) => (
        <WorkoutSummaryRow summary={item} onPress={() => router.push(`/workout/${item.id}`)} />
      )}
      ListEmptyComponent={
        <EmptyState
          title="No workouts yet"
          message="Finish your first workout and it will show up here, along with your weekly volume."
        />
      }
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
    gap: 12,
  },
});
