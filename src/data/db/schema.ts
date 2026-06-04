/**
 * Drizzle schema for the local SQLite store.
 *
 * Column shapes mirror the future Supabase/Postgres tables (text UUID PKs,
 * a `user_id` on every owned row for Row-Level Security, integer-cent money),
 * so the same schema transfers when the managed backend is added.
 */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const userId = text('user_id').notNull().default('local-user');
const boolean = (name: string) =>
  integer(name, { mode: 'boolean' }).notNull().default(false);

export const marketTypes = sqliteTable('market_types', {
  id: text('id').primaryKey(),
  userId,
  name: text('name').notNull(),
  isSystemDefault: boolean('is_system_default'),
});

export const expenseCategories = sqliteTable('expense_categories', {
  id: text('id').primaryKey(),
  userId,
  name: text('name').notNull(),
  isCogs: boolean('is_cogs'),
  isSystemDefault: boolean('is_system_default'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const markets = sqliteTable('markets', {
  id: text('id').primaryKey(),
  userId,
  name: text('name').notNull(),
  marketTypeId: text('market_type_id'),
  location: text('location'),
  date: text('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  setupMinutes: integer('setup_minutes').notNull().default(0),
  sellingMinutes: integer('selling_minutes').notNull().default(0),
  teardownMinutes: integer('teardown_minutes').notNull().default(0),
  status: text('status').notNull().default('planned'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  userId,
  marketId: text('market_id').notNull(),
  categoryId: text('category_id').notNull(),
  amount: integer('amount').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  userId,
  marketId: text('market_id').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  paymentMethod: text('payment_method'),
  createdAt: text('created_at').notNull(),
});
