import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { MaxWeightChart } from '@/components/MaxWeightChart';
import { PrTag } from '@/components/PrTag';
import {
  useExercise,
  useExerciseMaxWeightHistory,
  useRecentExerciseSets,
} from '@/lib/db/queries';
import { formatDate, formatEquipment, formatMuscleGroup, formatWeight } from '@/lib/format';
import { parseRouteId } from '@/lib/routeParams';
import { colors } from '@/lib/theme';

const RECENT_SETS_LIMIT = 20;

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const exerciseId = parseRouteId(params.id);
  const exercise = useExercise(exerciseId);
  const { data: history } = useExerciseMaxWeightHistory(exerciseId);
  const { data: recentSets } = useRecentExerciseSets(exerciseId, RECENT_SETS_LIMIT);

  if (exerciseId === null) {
    return <EmptyState title="Exercise not found" message="This exercise no longer exists." />;
  }
  // Null covers both "still loading" and "deleted" — render nothing rather
  // than flash a not-found state during the live query's first tick.
  if (!exercise) {
    return <View style={styles.container} />;
  }

  const personalBest =
    history.length > 0 ? Math.max(...history.map((point) => point.maxWeightKg)) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.subtitle}>
          {formatMuscleGroup(exercise.muscleGroup)} · {formatEquipment(exercise.equipment)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Personal best</Text>
        <Text style={styles.personalBest}>
          {personalBest !== null ? formatWeight(personalBest) : '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Max weight over time</Text>
        {history.length > 0 ? (
          <MaxWeightChart history={history} />
        ) : (
          <Text style={styles.emptyText}>
            No weighted sets yet — finish a workout with this exercise and your progress lands
            here.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Recent sets</Text>
        {recentSets.length === 0 ? (
          <Text style={styles.emptyText}>No sets logged yet.</Text>
        ) : (
          recentSets.map((set, index) => (
            <View key={set.id} style={[styles.setRow, index > 0 && styles.setRowDivider]}>
              <Text style={styles.setValue}>
                {set.reps} × {formatWeight(set.weightKg)}
              </Text>
              {set.isPr && <PrTag />}
              <Text style={styles.setDate}>{formatDate(set.createdAt)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  personalBest: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  setRowDivider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  setValue: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  setDate: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
