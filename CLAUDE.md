# CLAUDE.md — SetSaga

Gamified offline-first workout tracker (Expo / React Native). Full product spec lives in `SPEC.md` — read it before any task. Build strictly within the MVP scope in SPEC.md section 2; suggest extras, do not build them.

## Commands

- `npx expo start` — dev server (test on device via Expo Go)
- `npm test` — jest-expo test suite
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run db:generate` — drizzle-kit, generate a migration after schema changes

All four of test/lint/typecheck/CI must be green before any merge.

## Stack (locked — do not swap or add alternatives)

Expo SDK + TypeScript strict, Expo Router, expo-sqlite + Drizzle ORM, drizzle-kit migrations, Zustand, Victory Native, jest-expo, GitHub Actions. No backend, no network layer, no UI component kit, no extra state libraries.

## Conventions

- TypeScript strict; no `any` — use `unknown` and narrow. Types flow outward from `lib/db/schema.ts`.
- `lib/game/` and `lib/dates.ts` contain **pure functions only**: no React, no DB, no Expo imports there. This is non-negotiable — it's what makes the engine testable.
- All SQL goes through `lib/db/queries.ts`. Screens never import `expo-sqlite` or build queries directly; reads use Drizzle `useLiveQuery`.
- Zustand (`store/sessionStore.ts`) holds only transient session/UI state. Anything the DB owns is read from the DB.
- Weights are **kg** (`real`), timestamps are **unix ms** integers, day boundaries only via `toLocalDateKey()` — never inline date math.
- Schema changes: edit `schema.ts` → `npm run db:generate` → commit the migration. Never edit an already-applied migration file.
- Keep screens thin: layout and interaction in `app/`, logic in `lib/`, reusable UI in `components/`.

## Hard rules

- Never add a dependency without asking first.
- Never build accounts, sync, notifications, or any network feature — the app is local-first by design (SPEC.md section 11).
- The gamification rules in SPEC.md section 8 are exact. Changing any rule means updating its tests **first** — the tests are the spec.
- Don't change the structure of `data/exercises.json` without updating the seed logic and types in the same PR. Seeding must stay idempotent and must never touch `isCustom = 1` rows.
- Plan before implementing on any multi-file change; show the plan first.
- One phase per session, on a branch, merged via PR (phases in SPEC.md section 12).
- When a phase is done, update the README if behavior or setup changed.
