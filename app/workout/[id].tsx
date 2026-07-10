import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PrTag } from '@/components/PrTag';
import { useWorkout, useWorkoutDetailSets, type WorkoutDetailSet } from '@/lib/db/queries';
import { formatDate, formatDuration, formatVolume, formatWeight } from '@/lib/format';
import { colors } from '@/lib/theme';
import { parseRouteId } from '@/lib/routeParams';
import { deriveExerciseOrder, groupSetsByExercise } from '@/lib/workout';

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = parseRouteId(params.id);
  const workout = useWorkout(workoutId);
  const { data: detailSets } = useWorkoutDetailSets(workoutId);

  if (workoutId === null) {
    return <EmptyState title="Workout not found" message="This workout no longer exists." />;
  }
  // Null covers both "still loading" and "deleted" — render nothing rather
  // than flash a not-found state during the live query's first tick.
  if (!workout) {
    return <View style={styles.container} />;
  }

  const groups = groupSetsByExercise(detailSets);
  const exerciseOrder = deriveExerciseOrder(detailSets);
  const totalVolume = detailSets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {workout.name !== null && <Text style={styles.workoutName}>{workout.name}</Text>}
        <Text style={styles.date}>{formatDate(workout.startedAt)}</Text>
        <Text style={styles.stats}>
          {detailSets.length} {detailSets.length === 1 ? 'set' : 'sets'} ·{' '}
          {formatVolume(totalVolume)}
          {workout.finishedAt !== null &&
            ` · ${formatDuration(workout.finishedAt - workout.startedAt)}`}
        </Text>
        {workout.notes !== null && <Text style={styles.notes}>{workout.notes}</Text>}
      </View>

      {exerciseOrder.map((exerciseId) => {
        const exerciseSets = groups.get(exerciseId);
        if (!exerciseSets || exerciseSets.length === 0) return null;
        return (
          <View key={exerciseId} style={styles.card}>
            <Text style={styles.exerciseName}>{exerciseSets[0].exerciseName}</Text>
            {exerciseSets.map((set) => (
              <SetLine key={set.id} set={set} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function SetLine({ set }: { set: WorkoutDetailSet }) {
  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>#{set.setNumber}</Text>
      <Text style={styles.setValue}>
        {set.reps} × {formatWeight(set.weightKg)}
      </Text>
      {set.isPr && <PrTag />}
    </View>
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  workoutName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  date: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  stats: {
    color: colors.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  setNumber: {
    color: colors.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    width: 32,
  },
  setValue: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
});
