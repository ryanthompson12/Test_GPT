# Vendor Market Tracker

A mobile app for vendors at local markets (jewelry, candles, vintage, hats, …)
to track profitability and forecast cash flow — simply, without spreadsheets.

This is the **MVP prototype**: it runs on your phone, stores data locally, and
needs no account or backend. It's built so a managed cloud backend (logins,
sync, subscriptions) can be added later without rewriting the app.

## What it does today

- **Track each market** — log sales (one total, or split by cash/card/other),
  every expense (booth fee, COGS, **U-Haul / vehicle rental**, travel, food,
  staff, supplies, fees, and your own custom categories), and the time spent
  (setup + selling + teardown).
- **See your numbers automatically** — net profit, margin, ROI, and
  **profit-per-hour**, per market / per month / all-time, with charts.
- **Forecast** — “Based on your last 5 craft fairs, you typically net $X
  (range $Y–$Z)”, plus a **what-if** calculator to test changes.
- Comes pre-loaded with **demo markets** so it looks alive on first open.
  (Settings → *Clear all data* to start fresh, or *Load demo data* to restore.)

## Run it on your phone (no setup)

1. Install the free **Expo Go** app (App Store / Google Play).
2. On a computer with this project, run:
   ```bash
   npm install
   npm start
   ```
   (If your phone and computer aren't on the same Wi-Fi, run `npx expo start --tunnel`.)
3. A **QR code** appears. iPhone: scan it with the Camera app. Android: scan it
   inside Expo Go. The app opens. Your data is saved on the phone.

## Develop

```bash
npm test        # run the profit/forecast unit tests
npm run typecheck
npm start       # launch the dev server / QR code
```

## How it's built

- **Expo (React Native) + TypeScript**, file-based routing via **expo-router**.
- **Local-first data**: SQLite (`expo-sqlite`) + **Drizzle ORM**, behind
  repository interfaces (`src/data/repositories/types.ts`) — the single seam
  where a Supabase backend can be swapped in later.
- **TanStack Query** for data fetching/caching, **Zustand** for UI state,
  **react-hook-form + Zod** for forms, **react-native-gifted-charts** for charts.
- **Pure, tested domain logic** in `src/domain/` (profit math + forecasting).

See `docs/architecture.md` (in `CLAUDE.md`) for the folder map and the
backend-swap plan.
