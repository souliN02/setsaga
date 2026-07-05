import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// The only place expo-sqlite is imported. Everything else goes through `db`.
// enableChangeListener is what makes useLiveQuery reads re-render on writes.
const expoDb = openDatabaseSync('setsaga.db', { enableChangeListener: true });

expoDb.execSync('PRAGMA journal_mode = WAL;');
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

export type Db = typeof db;
