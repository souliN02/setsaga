# SetSaga

[![CI](https://github.com/souliN02/setsaga/actions/workflows/ci.yml/badge.svg)](https://github.com/souliN02/setsaga/actions/workflows/ci.yml)

Gamified offline-first workout tracker for iOS and Android. Log sets, reps and weight; the app turns consistency into XP, levels, streaks, badges and automatically detected personal records.

All data lives in SQLite on the device — no accounts, no backend, no network required. Full product spec in [SPEC.md](SPEC.md).

**Status:** Phase 0 — scaffold (tab navigation skeleton, tooling, CI). See SPEC.md section 12 for the build plan.

## Local setup

```sh
pnpm install
pnpm start        # then scan the QR code with Expo Go
```

## Scripts

```sh
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # jest-expo
```
