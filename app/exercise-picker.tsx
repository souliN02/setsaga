import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ExerciseListItem } from '@/components/ExerciseListItem';
import { FilterChips } from '@/components/FilterChips';
import { useExercises } from '@/lib/db/queries';
import type { MuscleGroup } from '@/lib/db/schema';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/format';
import { colors } from '@/lib/theme';
import { useSessionStore } from '@/store/sessionStore';

// The library as a picker (SPEC.md section 9): tapping an exercise adds it to
// the active session and closes the modal. Re-picking is a store no-op.
export default function ExercisePickerScreen() {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const addExerciseToSession = useSessionStore((state) => state.addExerciseToSession);

  const deferredSearch = useDeferredValue(search);
  const { data: exercises } = useExercises(deferredSearch, muscleGroup);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises"
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.chipsRow}>
        <FilterChips
          options={MUSCLE_GROUP_OPTIONS}
          selected={muscleGroup}
          onSelect={setMuscleGroup}
          allLabel="All"
        />
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ExerciseListItem
            exercise={item}
            onPress={() => {
              addExerciseToSession(item.id);
              router.back();
            }}
          />
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="No matching exercises"
            message="Try a different search or filter. Custom exercises can be created in the Library tab."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  chipsRow: {
    paddingBottom: 8,
  },
});
