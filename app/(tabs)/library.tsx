import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CreateExerciseModal } from '@/components/CreateExerciseModal';
import { EmptyState } from '@/components/EmptyState';
import { ExerciseListItem } from '@/components/ExerciseListItem';
import { FilterChips } from '@/components/FilterChips';
import { useExercises } from '@/lib/db/queries';
import type { MuscleGroup } from '@/lib/db/schema';
import { MUSCLE_GROUP_OPTIONS } from '@/lib/format';
import { colors } from '@/lib/theme';

export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  // Defer the query so typing stays responsive while the list catches up.
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
        <Pressable
          onPress={() => setCreateVisible(true)}
          accessibilityRole="button"
          style={styles.newButton}>
          <Text style={styles.newButtonText}>+ New</Text>
        </Pressable>
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
          // Outside a session the library is a browser: tap → exercise detail
          // (the in-session picker is the separate exercise-picker modal).
          <ExerciseListItem exercise={item} onPress={() => router.push(`/exercise/${item.id}`)} />
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="No matching exercises"
            message="Try a different search or filter — or create a custom exercise with the + New button."
          />
        }
      />

      <CreateExerciseModal visible={createVisible} onClose={() => setCreateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
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
  newButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  newButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  chipsRow: {
    paddingBottom: 8,
  },
});
