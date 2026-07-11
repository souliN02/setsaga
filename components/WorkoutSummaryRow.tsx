import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WorkoutSummary } from '@/lib/db/queries';
import { formatDate, formatVolume } from '@/lib/format';
import { colors } from '@/lib/theme';

import { PrTag } from './PrTag';

type Props = {
  summary: WorkoutSummary;
  onPress: () => void;
};

export function WorkoutSummaryRow({ summary, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.card}>
      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {summary.name ?? formatDate(summary.startedAt)}
        </Text>
        <Text style={styles.subtitle}>
          {summary.name !== null && `${formatDate(summary.startedAt)} · `}
          {summary.setCount} {summary.setCount === 1 ? 'set' : 'sets'} ·{' '}
          {formatVolume(summary.volumeKg)}
        </Text>
      </View>
      {summary.prCount > 0 && (
        <PrTag label={summary.prCount === 1 ? 'PR' : `${summary.prCount} PRs`} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
