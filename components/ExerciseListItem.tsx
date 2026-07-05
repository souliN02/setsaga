import { StyleSheet, Text, View } from 'react-native';

import type { Exercise } from '@/lib/db/schema';
import { formatEquipment, formatMuscleGroup } from '@/lib/format';
import { colors } from '@/lib/theme';

type Props = {
  exercise: Exercise;
};

export function ExerciseListItem({ exercise }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.subtitle}>
          {formatMuscleGroup(exercise.muscleGroup)} · {formatEquipment(exercise.equipment)}
        </Text>
      </View>
      {exercise.isCustom && (
        <View style={styles.customTag}>
          <Text style={styles.customTagText}>Custom</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  customTag: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  customTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
