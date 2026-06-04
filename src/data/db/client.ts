/**
 * Opens the on-device SQLite database and ensures the schema exists.
 *
 * The prototype creates tables with idempotent DDL at startup rather than
 * generated migration files — simple and deterministic. The Drizzle schema in
 * ./schema.ts maps the same shape onto Postgres when Supabase is added later.
 */
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const DDL = `
CREATE TABLE IF NOT EXISTS market_types (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  name TEXT NOT NULL,
  is_system_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  name TEXT NOT NULL,
  is_cogs INTEGER NOT NULL DEFAULT 0,
  is_system_default INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  name TEXT NOT NULL,
  market_type_id TEXT,
  location TEXT,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  setup_minutes INTEGER NOT NULL DEFAULT 0,
  selling_minutes INTEGER NOT NULL DEFAULT 0,
  teardown_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  market_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  market_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  payment_method TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_market ON expenses(market_id);
CREATE INDEX IF NOT EXISTS idx_sales_market ON sales(market_id);
`;

export const expoDb = openDatabaseSync('vendor-market.db');
expoDb.execSync('PRAGMA journal_mode = WAL;');
expoDb.execSync('PRAGMA foreign_keys = ON;');
expoDb.execSync(DDL);

export const db = drizzle(expoDb, { schema });
export type Database = typeof db;
