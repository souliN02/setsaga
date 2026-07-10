import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StreakFlame } from '@/components/StreakFlame';
import { XpBar } from '@/components/XpBar';
import { startWorkout, useGameStats, useRecentPrs } from '@/lib/db/queries';
import { formatDate, formatVolume, formatWeight } from '@/lib/format';
import { levelProgress, totalXp } from '@/lib/game/xp';
import { colors } from '@/lib/theme';
import { useTodayKey } from '@/lib/useTodayKey';
import { useSessionStore } from '@/store/sessionStore';

export default function HomeScreen() {
  const todayKey = useTodayKey();
  const stats = useGameStats(todayKey);
  const { data: recentPrs } = useRecentPrs(5);
  const activeWorkoutId = useSessionStore((state) => state.activeWorkoutId);
  const startSession = useSessionStore((state) => state.startSession);
  const [pending, setPending] = useState(false);

  const progress = levelProgress(
    totalXp({
      sets: stats.lifetimeSets,
      workouts: stats.finishedWorkouts,
      prEvents: stats.prEvents,
    }),
  );

  const onStartWorkout = async () => {
    if (pending) return;
    // A session is already running — don't start a second one, just go to it.
    if (activeWorkoutId !== null) {
      router.navigate('/workout');
      return;
    }
    setPending(true);
    try {
      // Same write-through start as the Workout tab: row first, then UI state.
      const workout = await startWorkout();
      startSession(workout.id);
      router.navigate('/workout');
    } finally {
      setPending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <XpBar progress={progress} />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statsCell]}>
          <StreakFlame streak={stats.currentStreak} atRisk={stats.streakAtRisk} />
        </View>
        <View style={[styles.card, styles.statsCell]}>
          <Text style={styles.weekHeading}>This week</Text>
          <Text style={styles.weekValue}>
            {stats.weekWorkouts} {stats.weekWorkouts === 1 ? 'workout' : 'workouts'}
          </Text>
          <Text style={styles.weekVolume}>{formatVolume(stats.weekVolumeKg)}</Text>
        </View>
      </View>

      <Pressable
        onPress={onStartWorkout}
        disabled={pending}
        accessibilityRole="button"
        accessibilityState={{ disabled: pending }}
        style={[styles.startButton, pending && styles.buttonDisabled]}>
        <Text style={styles.startButtonText}>
          {activeWorkoutId !== null ? 'Continue workout' : 'Start workout'}
        </Text>
      </Pressable>

      <View style={styles.prSection}>
        <Text style={styles.sectionTitle}>Recent PRs</Text>
        <View style={styles.card}>
          {recentPrs.length === 0 ? (
            <Text style={styles.emptyText}>
              No PRs yet — lift heavier than your previous best and it lands here.
            </Text>
          ) : (
            recentPrs.map((pr, index) => (
              <View key={pr.setId} style={[styles.prRow, index > 0 && styles.prRowDivider]}>
                <View style={styles.prText}>
                  <Text style={styles.prName} numberOfLines={1}>
                    {pr.exerciseName}
                  </Text>
                  <Text style={styles.prDate}>{formatDate(pr.createdAt)}</Text>
                </View>
                <Text style={styles.prWeight}>{formatWeight(pr.weightKg)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statsCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeading: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  weekValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  weekVolume: {
    color: colors.textSecondary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  startButton: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  prSection: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  prRowDivider: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  prText: {
    flex: 1,
    gap: 2,
  },
  prName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  prDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  prWeight: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
