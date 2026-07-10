import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

type Props = {
  streak: number;
  atRisk: boolean;
};

// Grey outline when no streak, primary flame while alive, danger flame on the
// last day before it breaks (SPEC.md section 8.3's at-risk state).
export function StreakFlame({ streak, atRisk }: Props) {
  const active = streak > 0;
  const flameColor = active ? (atRisk ? colors.danger : colors.primary) : colors.textSecondary;
  return (
    <View style={styles.container}>
      <Ionicons name={active ? 'flame' : 'flame-outline'} size={30} color={flameColor} />
      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
      {atRisk ? <Text style={styles.risk}>Train today to keep it!</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
  },
  count: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  risk: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
