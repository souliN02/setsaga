import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { parseReps, parseWeightKg } from '@/lib/workout';
import { colors } from '@/lib/theme';

type Props = {
  initialReps?: number;
  initialWeightKg?: number;
  submitLabel: string;
  onSubmit: (reps: number, weightKg: number) => void;
  onCancel?: () => void;
};

// Shared input row for quick-add and edit. Input state is kept as strings so
// iOS decimal entry isn't fought by a controlled numeric value; parsing/validation
// lives in lib/workout.ts.
export function SetInputRow({ initialReps, initialWeightKg, submitLabel, onSubmit, onCancel }: Props) {
  const [repsText, setRepsText] = useState(initialReps !== undefined ? String(initialReps) : '');
  const [weightText, setWeightText] = useState(
    initialWeightKg !== undefined ? String(initialWeightKg) : '',
  );

  const reps = parseReps(repsText);
  const weightKg = parseWeightKg(weightText);
  const canSubmit = reps !== null && weightKg !== null;

  return (
    <View style={styles.row}>
      <TextInput
        value={repsText}
        onChangeText={setRepsText}
        placeholder="Reps"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        style={styles.input}
      />
      <TextInput
        value={weightText}
        onChangeText={setWeightText}
        placeholder="kg"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      {onCancel && (
        <Pressable onPress={onCancel} accessibilityRole="button" style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => {
          if (reps !== null && weightKg !== null) {
            onSubmit(reps, weightKg);
          }
        }}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
        style={[styles.submitButton, !canSubmit && styles.submitDisabled]}>
        <Text style={styles.submitText}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
});
