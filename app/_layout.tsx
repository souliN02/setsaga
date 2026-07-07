import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import migrations from '@/drizzle/migrations';
import { db } from '@/lib/db/client';
import { discardWorkout, getUnfinishedWorkouts, getWorkoutSets } from '@/lib/db/queries';
import { seedExercises } from '@/lib/db/seed';
import { colors } from '@/lib/theme';
import { deriveExerciseOrder, pickRecoveryWorkout } from '@/lib/workout';
import { useSessionStore } from '@/store/sessionStore';

// Keep the splash visible until migrations + seeding have finished.
SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function useDatabaseReady(): { ready: boolean; error: Error | null } {
  const { success, error: migrationError } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success) return;
    seedExercises(db)
      .then(() => setSeeded(true))
      .catch((cause: unknown) =>
        setSeedError(cause instanceof Error ? cause : new Error(String(cause))),
      );
  }, [success]);

  return { ready: success && seeded, error: migrationError ?? seedError ?? null };
}

// Crash recovery (SPEC.md section 4): a workout row with finishedAt = null is
// an interrupted session. Detect it once per launch and offer Resume/Discard.
function useWorkoutRecovery(ready: boolean) {
  const checked = useRef(false);

  useEffect(() => {
    if (!ready || checked.current) return;
    checked.current = true;

    (async () => {
      const { resume, staleIds } = pickRecoveryWorkout(await getUnfinishedWorkouts());
      // Stale rows can't be created via the UI, but recovery must never
      // resume the wrong one — clean them up silently.
      for (const staleId of staleIds) {
        await discardWorkout(staleId);
      }
      if (!resume) return;

      const workoutSets = await getWorkoutSets(resume.id);
      const startedAt = new Date(resume.startedAt).toLocaleString();
      const setCount = workoutSets.length;
      Alert.alert(
        'Unfinished workout',
        `You have a workout in progress (started ${startedAt}, ${setCount} ${setCount === 1 ? 'set' : 'sets'}). Resume it?`,
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              discardWorkout(resume.id);
            },
          },
          {
            text: 'Resume',
            onPress: () => {
              useSessionStore
                .getState()
                .resumeSession(resume.id, deriveExerciseOrder(workoutSets));
              router.navigate('/workout');
            },
          },
        ],
        { cancelable: false },
      );
    })();
  }, [ready]);
}

export default function RootLayout() {
  const { ready, error } = useDatabaseReady();
  useWorkoutRecovery(ready);

  useEffect(() => {
    if (ready || error) {
      SplashScreen.hideAsync();
    }
  }, [ready, error]);

  if (error) {
    return (
      <PlaceholderScreen
        title="Something went wrong"
        note={`The database could not be prepared. Restarting the app may help.\n\n${error.message}`}
      />
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="exercise-picker"
            options={{ presentation: 'modal', title: 'Add exercise' }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
