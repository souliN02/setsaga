import { StyleSheet, Text, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';

import { formatCompactCount, formatDateKey } from '@/lib/format';
import type { WeeklyVolumeBucket } from '@/lib/history';
import { colors } from '@/lib/theme';

import { chartAxisFont } from './chartFont';

type Props = {
  buckets: WeeklyVolumeBucket[];
};

// Weekly training volume, one zero-based bar per Monday-start week. Single
// series in the app accent; axis text stays in text tokens.
export function WeeklyVolumeChart({ buckets }: Props) {
  const data = buckets.map((bucket, index) => ({ index, volumeKg: bucket.volumeKg }));
  const maxVolume = Math.max(...buckets.map((bucket) => bucket.volumeKg), 1);

  // Every-other-week labels (current week always labeled) so eight date labels
  // don't collide on a phone-width axis.
  const xLabel = (value: number): string => {
    const index = Math.round(value);
    const bucket = buckets[index];
    if (!bucket || (buckets.length - 1 - index) % 2 !== 0) return '';
    return formatDateKey(bucket.weekStartKey);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly volume (kg)</Text>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="index"
          yKeys={['volumeKg']}
          // Bars encode length, so the y-domain must start at zero.
          domain={{ y: [0, maxVolume * 1.05] }}
          domainPadding={{ left: 20, right: 20 }}
          axisOptions={{
            font: chartAxisFont,
            labelColor: colors.textSecondary,
            lineColor: colors.border,
            tickCount: { x: buckets.length, y: 4 },
            formatXLabel: xLabel,
            formatYLabel: formatCompactCount,
          }}>
          {({ points, chartBounds }) => (
            <Bar
              points={points.volumeKg}
              chartBounds={chartBounds}
              color={colors.primary}
              innerPadding={0.4}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  chart: {
    height: 180,
  },
});
