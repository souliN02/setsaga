import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FilterChips } from '@/components/FilterChips';
import { DuplicateExerciseNameError, createCustomExercise } from '@/lib/db/queries';
import type { Equipment, MuscleGroup } from '@/lib/db/schema';
import { EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS } from '@/lib/format';
import { colors } from '@/lib/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CreateExerciseModal({ visible, onClose }: Props) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && muscleGroup !== null && equipment !== null && !saving;

  const handleClose = () => {
    setName('');
    setMuscleGroup(null);
    setEquipment(null);
    setError(null);
    setSaving(false);
    onClose();
  };

  const handleSave = async () => {
    if (muscleGroup === null || equipment === null) return;
    setSaving(true);
    setError(null);
    try {
      await createCustomExercise({ name, muscleGroup, equipment });
      handleClose();
    } catch (cause) {
      setSaving(false);
      setError(
        cause instanceof DuplicateExerciseNameError
          ? cause.message
          : 'Could not save the exercise. Please try again.',
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      {/* 'padding' on Android too: edge-to-edge disables adjustResize, so the
          keyboard would otherwise cover this bottom sheet. */}
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>New custom exercise</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Landmine Press"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            autoFocus
            maxLength={60}
          />

          <Text style={styles.label}>Muscle group</Text>
          <FilterChips
            options={MUSCLE_GROUP_OPTIONS}
            selected={muscleGroup}
            onSelect={setMuscleGroup}
            wrap
          />

          <Text style={styles.label}>Equipment</Text>
          <FilterChips
            options={EQUIPMENT_OPTIONS}
            selected={equipment}
            onSelect={setEquipment}
            wrap
          />

          {error !== null && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable onPress={handleClose} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[styles.button, styles.saveButton, !canSave && styles.saveButtonDisabled]}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    color: '#F97066',
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
});
