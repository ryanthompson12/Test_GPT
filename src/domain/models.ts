/**
 * Domain models — plain, storage-agnostic TypeScript types.
 *
 * These deliberately carry no `userId`: the prototype is single-user/local.
 * When a managed backend (Supabase) is added, the DB layer attaches `userId`
 * for Row-Level Security; the app's domain types stay unchanged.
 *
 * All money fields are integer **cents** (see lib/money.ts).
 */

export type MarketStatus = 'planned' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'other';

export interface MarketType {
  id: string;
  name: string;
  isSystemDefault: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  /** COGS categories feed the gross-margin breakout and are tracked separately. */
  isCOGS: boolean;
  isSystemDefault: boolean;
  sortOrder: number;
}

export interface Market {
  id: string;
  name: string;
  marketTypeId: string | null;
  location: string | null;
  /** ISO date (yyyy-mm-dd) the market takes place. */
  date: string;
  /** Optional clock times as "HH:mm" for reference; not used in math. */
  startTime: string | null;
  endTime: string | null;
  /** Time inputs that power the per-hour metrics. */
  setupMinutes: number;
  sellingMinutes: number;
  teardownMinutes: number;
  status: MarketStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  marketId: string;
  categoryId: string;
  /** integer cents */
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface Sale {
  id: string;
  marketId: string;
  /** integer cents */
  amount: number;
  description: string | null;
  /** Optional split; a single daily total is just one Sale with null method. */
  paymentMethod: PaymentMethod | null;
  createdAt: string;
}

/** A market plus its child rows — the unit the calculation layer consumes. */
export interface MarketWithDetails {
  market: Market;
  sales: Sale[];
  expenses: Expense[];
}
