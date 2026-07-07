import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ElapsedTime } from '@/components/ElapsedTime';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseSection } from '@/components/ExerciseSection';
import {
  addSet,
  deleteSet,
  discardWorkout,
  finishWorkout,
  startWorkout,
  updateSet,
  useActiveWorkout,
  useExercisesByIds,
  useWorkoutSets,
} from '@/lib/db/queries';
import { colors } from '@/lib/theme';
import { deriveExerciseOrder, groupSetsByExercise, mergeExerciseOrder } from '@/lib/workout';
import { useSessionStore } from '@/store/sessionStore';

export default function WorkoutScreen() {
  const activeWorkoutId = useSessionStore((state) => state.activeWorkoutId);

  if (activeWorkoutId === null) {
    return <StartWorkoutView />;
  }
  return <ActiveSessionView workoutId={activeWorkoutId} />;
}

function StartWorkoutView() {
  const startSession = useSessionStore((state) => state.startSession);
  const [pending, setPending] = useState(false);

  const onStart = async () => {
    if (pending) return;
    setPending(true);
    try {
      // Write-through: the workout row hits SQLite before any UI state exists,
      // so a crash from here on is always recoverable.
      const workout = await startWorkout();
      startSession(workout.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.startContainer}>
      <Text style={styles.startTitle}>Ready to lift?</Text>
      <Text style={styles.startSubtitle}>
        Sets are saved the moment you log them — even if the app dies mid-session.
      </Text>
      <Pressable
        onPress={onStart}
        disabled={pending}
        accessibilityRole="button"
        accessibilityState={{ disabled: pending }}
        style={[styles.startButton, pending && styles.buttonDisabled]}>
        <Text style={styles.startButtonText}>Start workout</Text>
      </Pressable>
    </View>
  );
}

function ActiveSessionView({ workoutId }: { workoutId: number }) {
  const exerciseOrder = useSessionStore((state) => state.exerciseOrder);
  const endSession = useSessionStore((state) => state.endSession);
  const [pending, setPending] = useState(false);
  const listRef = useRef<FlatList<number>>(null);
  const pendingScrollIndex = useRef<number | null>(null);

  const scrollToSection = (index: number) => {
    listRef.current?.scrollToIndex({ index, viewPosition: 0, animated: true });
  };

  // Scrolling at focus time gets clamped: the keyboard isn't up yet, so the
  // list is still full-height with no scroll room. Defer to keyboardDidShow,
  // after KeyboardAvoidingView has shrunk the viewport.
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      const index = pendingScrollIndex.current;
      if (index === null) return;
      pendingScrollIndex.current = null;
      requestAnimationFrame(() => scrollToSection(index));
    });
    return () => subscription.remove();
  }, []);

  const onSectionInputFocus = (index: number) => {
    if (Keyboard.isVisible()) {
      scrollToSection(index);
    } else {
      pendingScrollIndex.current = index;
    }
  };

  const workout = useActiveWorkout(workoutId);
  const { data: sets } = useWorkoutSets(workoutId);
  const order = mergeExerciseOrder(exerciseOrder, deriveExerciseOrder(sets));
  const { data: exerciseRows } = useExercisesByIds(order);

  const exercisesById = new Map(exerciseRows.map((exercise) => [exercise.id, exercise]));
  const setsByExercise = groupSetsByExercise(sets);

  const onFinish = () => {
    if (pending) return;
    if (sets.length === 0) {
      // A "finished" workout with zero sets would be junk data — SPEC.md
      // section 6 requires >= 1 set — so offer to discard instead.
      Alert.alert('Nothing logged', 'This workout has no sets. Discard it?', [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            setPending(true);
            try {
              await discardWorkout(workoutId);
              endSession();
            } finally {
              setPending(false);
            }
          },
        },
      ]);
      return;
    }
    Alert.alert('Finish workout?', `${sets.length} ${sets.length === 1 ? 'set' : 'sets'} logged.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          setPending(true);
          try {
            await finishWorkout(workoutId);
            endSession();
          } finally {
            setPending(false);
          }
        },
      },
    ]);
  };

  return (
    // Edge-to-edge Android turns adjustResize into adjustNothing (the window no
    // longer shrinks for the keyboard), so the screen compensates itself:
    // padding via KeyboardAvoidingView + scrolling the focused section into view.
    // iOS is handled by automaticallyAdjustKeyboardInsets on the list.
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'padding' : undefined}>
      <View style={styles.sessionHeader}>
        {workout ? (
          <ElapsedTime startedAt={workout.startedAt} />
        ) : (
          <Text style={styles.timePlaceholder}>0:00</Text>
        )}
        <Pressable
          onPress={onFinish}
          disabled={pending}
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          style={[styles.finishButton, pending && styles.buttonDisabled]}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={order}
        keyExtractor={(exerciseId) => String(exerciseId)}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        onScrollToIndexFailed={() => listRef.current?.scrollToEnd()}
        renderItem={({ item: exerciseId, index }) => {
          const exercise = exercisesById.get(exerciseId);
          if (!exercise) return null;
          return (
            <ExerciseSection
              exercise={exercise}
              sets={setsByExercise.get(exerciseId) ?? []}
              onAddSet={(reps, weightKg) => {
                void addSet({ workoutId, exerciseId, reps, weightKg });
              }}
              onUpdateSet={(setId, reps, weightKg) => {
                void updateSet(setId, { reps, weightKg });
              }}
              onDeleteSet={(setId) => {
                void deleteSet(setId);
              }}
              onInputFocus={() => onSectionInputFocus(index)}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No exercises yet"
            message="Tap Add exercise to pick from the library and start logging sets."
          />
        }
        ListFooterComponent={
          <Pressable
            onPress={() => router.push('/exercise-picker')}
            accessibilityRole="button"
            style={styles.addExerciseButton}>
            <Text style={styles.addExerciseText}>+ Add exercise</Text>
          </Pressable>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  startContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  startTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  startSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  startButton: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  startButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timePlaceholder: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  finishButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  finishButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  addExerciseButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addExerciseText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
