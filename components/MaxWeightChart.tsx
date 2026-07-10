import { StyleSheet, View } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';

import type { MaxWeightPoint } from '@/lib/db/queries';
import { formatShortDate } from '@/lib/format';
import { colors } from '@/lib/theme';

import { chartAxisFont } from './chartFont';

type Props = {
  history: MaxWeightPoint[];
};

// Axis breathing room around sparse data — this is not a day-boundary
// decision, just pixels of padding expressed in time.
const MS_PER_DAY = 86_400_000;

function domainFor(history: MaxWeightPoint[]): { x: [number, number]; y: [number, number] } {
  const xValues = history.map((point) => point.startedAt);
  const yValues = history.map((point) => point.maxWeightKg);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  // A weight line encodes position, not length, so the y-domain hugs the data
  // instead of starting at zero; degenerate (single-value) domains get padded
  // so the lone point renders mid-chart instead of collapsing the scale.
  const yPad = yMin === yMax ? Math.max(yMax * 0.1, 2.5) : (yMax - yMin) * 0.2;
  return {
    x: xMin === xMax ? [xMin - MS_PER_DAY, xMax + MS_PER_DAY] : [xMin, xMax],
    y: [Math.max(0, yMin - yPad), yMax + yPad],
  };
}

// Max weight per workout over time. Points render on top of the line (with a
// surface ring) so 1–2 data points stay visible — the spec's minimum case.
export function MaxWeightChart({ history }: Props) {
  const data = history.map((point) => ({
    startedAt: point.startedAt,
    maxWeightKg: point.maxWeightKg,
  }));

  return (
    <View style={styles.chart}>
      <CartesianChart
        data={data}
        xKey="startedAt"
        yKeys={['maxWeightKg']}
        domain={domainFor(history)}
        domainPadding={{ left: 16, right: 16, top: 8, bottom: 8 }}
        axisOptions={{
          font: chartAxisFont,
          labelColor: colors.textSecondary,
          lineColor: colors.border,
          tickCount: { x: Math.min(4, data.length + 1), y: 4 },
          formatXLabel: formatShortDate,
          formatYLabel: (value) => String(Math.round(value)),
        }}>
        {({ points }) => (
          <>
            <Line
              points={points.maxWeightKg}
              color={colors.primary}
              strokeWidth={2}
              curveType="linear"
            />
            <Scatter points={points.maxWeightKg} radius={6} color={colors.surface} />
            <Scatter points={points.maxWeightKg} radius={4} color={colors.primary} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 200,
  },
});
