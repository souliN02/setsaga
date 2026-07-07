import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { formatDuration } from '@/lib/format';
import { colors } from '@/lib/theme';

type Props = {
  startedAt: number;
};

// Always derived from startedAt, never an incremented counter — stays correct
// after crash resume, backgrounding and clock changes.
export function ElapsedTime({ startedAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return <Text style={styles.time}>{formatDuration(now - startedAt)}</Text>;
}

const styles = StyleSheet.create({
  time: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
