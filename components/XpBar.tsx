import { StyleSheet, Text, View } from 'react-native';

import { formatCount } from '@/lib/format';
import type { LevelProgress } from '@/lib/game/xp';
import { colors } from '@/lib/theme';

type Props = {
  progress: LevelProgress;
};

export function XpBar({ progress }: Props) {
  const ratio = Math.min(progress.xpIntoLevel / progress.xpForNextLevel, 1);
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: progress.xpForNextLevel, now: progress.xpIntoLevel }}>
      <View style={styles.labels}>
        <Text style={styles.level}>Level {progress.level}</Text>
        <Text style={styles.xp}>
          {formatCount(progress.xpIntoLevel)} / {formatCount(progress.xpForNextLevel)} XP
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  level: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  xp: {
    color: colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
