@AGENTS.md

# Vendor Market Tracker — project notes

Mobile app (Expo SDK 56 + TypeScript, expo-router) for market vendors to track
profitability and forecast cash flow. Local-first prototype; no backend yet.

## Commands
- `npm start` — dev server / Expo Go QR
- `npm test` — Jest unit tests (domain math)
- `npm run typecheck` — `tsc --noEmit`
- `npx expo export --platform ios --output-dir /tmp/x` — verify the bundle builds

## Architecture (key seams)
- `src/domain/` — PURE logic, no React/DB. `calculations.ts` (profit, margin,
  per-hour, roll-ups) and `forecast.ts` (explainable averaging + what-if). Fully
  unit-tested — keep it that way.
- `src/data/db/` — Drizzle schema + SQLite client (idempotent DDL at startup).
- `src/data/repositories/` — `types.ts` holds the interfaces ALL app code
  depends on; `sqlite.ts` implements them; `index.ts` is the factory and the
  single swap point for a future Supabase backend. Don't import the DB directly
  from screens.
- `src/features/` — TanStack Query hooks (`hooks.ts`) + analytics selectors
  (`analytics.ts`). Screens use these, never repositories directly.
- `src/ui/` — theme + reusable components. `app/` — expo-router screens (thin).

## Conventions
- Money is **integer cents** everywhere; format only at display (`lib/money.ts`).
- Add new persisted fields to: Drizzle schema, the DDL in `db/client.ts`, the
  domain model, the repository mapper, and any Zod form schema.
