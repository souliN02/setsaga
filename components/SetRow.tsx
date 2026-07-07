import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { WorkoutSet } from '@/lib/db/schema';
import { formatWeight } from '@/lib/format';
import { colors } from '@/lib/theme';

const dangerColor = '#F97066';

type Props = {
  set: WorkoutSet;
  onPress: () => void;
  onDelete: () => void;
};

// Swipe left to delete — no confirmation: a set is three numbers and cheap to
// re-add; confirming every delete mid-workout is hostile.
export function SetRow({ set, onPress, onDelete }: Props) {
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable onPress={onDelete} accessibilityRole="button" style={styles.deleteAction}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}>
      <Pressable onPress={onPress} accessibilityRole="button" style={styles.row}>
        <Text style={styles.setNumber}>#{set.setNumber}</Text>
        <View style={styles.values}>
          <Text style={styles.valueText}>
            {set.reps} × {formatWeight(set.weightKg)}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  setNumber: {
    color: colors.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    width: 32,
  },
  values: {
    flex: 1,
  },
  valueText: {
    color: colors.text,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: dangerColor,
    paddingHorizontal: 20,
  },
  deleteText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
