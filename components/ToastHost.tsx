import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CelebrationKind, CelebrationToast } from '@/lib/celebrations';
import { hapticCelebration } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { useToastStore } from '@/store/toastStore';

// One celebration at a time, auto-advancing through the queue; tap to skip
// ahead. Mounted once in the root layout, above the navigator.

const TOAST_VISIBLE_MS = 2600;

const ICONS: Record<CelebrationKind, ComponentProps<typeof Ionicons>['name']> = {
  pr: 'trending-up',
  levelUp: 'arrow-up-circle',
  badge: 'trophy',
};

export function ToastHost() {
  const toast = useToastStore((state) => state.queue[0]);
  if (!toast) return null;
  // Keyed by id so each toast remounts and runs its own entrance + timer.
  return <ToastCard key={toast.id} toast={toast} />;
}

function ToastCard({ toast }: { toast: CelebrationToast }) {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const insets = useSafeAreaInsets();
  // Lazy state, not a ref: created once per card and stable across renders.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Each toast is its own keyed mount, so this fires exactly once per toast.
    hapticCelebration();
    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(dismissToast, TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [dismissToast, progress]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { top: insets.top + 12 },
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
          ],
        },
      ]}>
      <Pressable accessibilityRole="button" onPress={dismissToast} style={styles.card}>
        <Ionicons name={ICONS[toast.kind]} color={colors.primary} size={28} />
        <View style={styles.textColumn}>
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.detail} numberOfLines={2}>
            {toast.detail}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
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
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
