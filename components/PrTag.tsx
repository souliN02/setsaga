import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

type Props = {
  label?: string;
};

// Amber pill marking PR sets and PR counts across History and detail screens.
export function PrTag({ label = 'PR' }: Props) {
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
