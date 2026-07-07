import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SetInputRow } from '@/components/SetInputRow';
import { SetRow } from '@/components/SetRow';
import type { Exercise, WorkoutSet } from '@/lib/db/schema';
import { colors } from '@/lib/theme';
import { lastSetFor } from '@/lib/workout';

type Props = {
  exercise: Exercise;
  sets: WorkoutSet[];
  onAddSet: (reps: number, weightKg: number) => void;
  onUpdateSet: (setId: number, reps: number, weightKg: number) => void;
  onDeleteSet: (setId: number) => void;
  // Edge-to-edge Android doesn't resize the window for the keyboard, so the
  // screen scrolls this section into view itself when one of its inputs focuses.
  onInputFocus?: () => void;
};

export function ExerciseSection({
  exercise,
  sets,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onInputFocus,
}: Props) {
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const lastSet = lastSetFor(sets, exercise.id);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.count}>
          {sets.length} {sets.length === 1 ? 'set' : 'sets'}
        </Text>
      </View>

      {sets.map((set) =>
        set.id === editingSetId ? (
          <SetInputRow
            key={set.id}
            initialReps={set.reps}
            initialWeightKg={set.weightKg}
            submitLabel="Save"
            onSubmit={(reps, weightKg) => {
              onUpdateSet(set.id, reps, weightKg);
              setEditingSetId(null);
            }}
            onCancel={() => setEditingSetId(null)}
            onFocus={onInputFocus}
          />
        ) : (
          <SetRow
            key={set.id}
            set={set}
            onPress={() => setEditingSetId(set.id)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ),
      )}

      {/* Keyed by the last set so it remounts with fresh quick-add defaults
          whenever a set is logged (or on resume, once live data arrives). */}
      <SetInputRow
        key={lastSet?.id ?? 'empty'}
        initialReps={lastSet?.reps}
        initialWeightKg={lastSet?.weightKg}
        submitLabel="Log set"
        onSubmit={onAddSet}
        onFocus={onInputFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
