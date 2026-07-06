import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import migrations from '@/drizzle/migrations';
import { db } from '@/lib/db/client';
import { seedExercises } from '@/lib/db/seed';
import { colors } from '@/lib/theme';

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

export default function RootLayout() {
  const { ready, error } = useDatabaseReady();

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
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
