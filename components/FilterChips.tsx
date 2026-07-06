import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: readonly ChipOption<T>[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  /** When set, renders a leading chip that maps to `null` (no filter). */
  allLabel?: string;
  /** Wrap into multiple lines (for forms) instead of scrolling horizontally. */
  wrap?: boolean;
};

export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
  allLabel,
  wrap = false,
}: Props<T>) {
  const chips = (
    <>
      {allLabel !== undefined && (
        <Chip label={allLabel} active={selected === null} onPress={() => onSelect(null)} />
      )}
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          active={selected === option.value}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </>
  );

  if (wrap) {
    return <View style={styles.wrapRow}>{chips}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollRow}>
      {chips}
    </ScrollView>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollRow: {
    gap: 8,
    paddingHorizontal: 16,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
});
